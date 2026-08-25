<script setup>
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import { ref, onMounted, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import rewardServices from "../../../services/rewardServices";
import studentServices from "../../../services/studentServices";
import studentRewardServices from "../../../services/studentRewardServices";
import CardHeader from "../../../components/CardHeader.vue";
import CardTable from "../../../components/CardTable.vue";
import RewardCard from "../../../components/cards/RewardCard.vue";
import { userStore } from "../../../stores/userStore";
import SortSelect from "../../../components/SortSelect.vue";
// Constants
const DIALOG_TIMEOUT = 2000;
const sortProperties = [
  { title: "Points", value: "points" },
  { title: "Name", value: "name" },
];

// Store and Router
const route = useRoute();
const store = userStore();
const { user } = storeToRefs(store);
const display = useDisplay();

// State
const rewards = ref([]);
const student = ref(null);
const page = ref(1);
const count = ref(0);
const searchQuery = ref("");
const showRedemptionDialog = ref(false);
const showRedemptionHistoryDialog = ref(false);
const redemptionHistory = ref([]);
const loadingRedemptionHistory = ref(false);
const showRedemptionSuccess = ref(false);
const showRedemptionError = ref(false);
const selectedReward = ref(null);
const sortOptions = ref({
  sortAttribute: sortProperties[0].value,
  sortDirection: "asc",
});
const showFilters = ref(false);

// Computed Properties
const numCardColumns = computed(() => {
  if (display.xxl.value) return showFilters.value ? 3 : 4;
  if (display.xl.value) return showFilters.value ? 3 : 3;
  if (display.lg.value) return showFilters.value ? 2 : 3;
  if (display.md.value) return showFilters.value ? 1 : 2;
  if (display.sm.value) return 1;
  return 1;
});
const pageSize = computed(() => numCardColumns.value * 2);

const dialogState = computed(() => {
  if (showRedemptionSuccess.value) return "success";
  if (showRedemptionError.value) return "error";
  return "default";
});

const studentPoints = computed(() => {
  if (!student.value) return 0;
  return (
    (Number(student.value.pointsAwarded) || 0) -
    (Number(student.value.pointsUsed) || 0)
  );
});

const totalRedeemedPoints = computed(() =>
  redemptionHistory.value.reduce((total, redemption) => {
    const points =
      redemption.pointsDeducted ?? redemption.reward?.points ?? 0;
    return total + Number(points);
  }, 0),
);

// Helper Functions
const resetDialogState = () => {
  showRedemptionSuccess.value = false;
  showRedemptionError.value = false;
  showRedemptionDialog.value = false;
};

const showDialogMessage = (isSuccess) => {
  if (isSuccess) {
    showRedemptionSuccess.value = true;
  } else {
    showRedemptionError.value = true;
  }
  setTimeout(resetDialogState, DIALOG_TIMEOUT);
};

// Data Fetching
const fetchRewards = async () => {
  try {
    const response = await rewardServices.getAllActiveRewards(
      page.value,
      pageSize.value,
      searchQuery.value,
      {
        sortAttribute: sortOptions.value.sortAttribute,
        sortDirection: sortOptions.value.sortDirection,
      },
    );
    rewards.value = response.data.rewards;
    count.value = response.data.count;
  } catch (error) {
    console.error("Error fetching rewards:", error);
  }
};

const fetchStudentById = async () => {
  try {
    const response = await studentServices.getStudentById(
      route.params.studentId,
    );
    student.value = response.data;
  } catch (error) {
    console.error("Error fetching student:", error);
  }
};

// Event Handlers
const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1;
};

const handleRedeem = (reward) => {
  selectedReward.value = reward;
  showRedemptionDialog.value = true;
};

const formatRedemptionDate = (date) => {
  if (!date) return "Unknown date";
  return new Date(date).toLocaleString();
};

const fetchRedemptionHistory = async () => {
  if (!student.value?.id) {
    redemptionHistory.value = [];
    return;
  }
  loadingRedemptionHistory.value = true;
  try {
    const response =
      await studentRewardServices.getAllStudentRewardsForStudent(
        student.value.id,
      );
    redemptionHistory.value = response.data || [];
  } catch (error) {
    console.error("Error fetching redemption history:", error);
    redemptionHistory.value = [];
  } finally {
    loadingRedemptionHistory.value = false;
  }
};

const openRedemptionHistory = async () => {
  showRedemptionHistoryDialog.value = true;
  await fetchRedemptionHistory();
};

const handleRedeemConfirm = async () => {
  try {
    await rewardServices.redeemReward(
      selectedReward.value.id,
      student.value.id,
      user.value.userId || user.value.id,
    );

    showDialogMessage(true);
    await Promise.all([fetchStudentById(), fetchRewards()]);
    if (showRedemptionHistoryDialog.value) {
      await fetchRedemptionHistory();
    }
  } catch (error) {
    console.error("Error redeeming reward:", error);
    showDialogMessage(false);
  }
};

const handleClearFilters = () => {
  sortOptions.value = {
    sortAttribute: sortProperties[0].value,
    sortDirection: "asc",
  };
  page.value = 1;
  fetchRewards();
};

const handleChangeFilters = () => {
  page.value = 1;
  fetchRewards();
};

// Lifecycle Hooks
onMounted(async () => {
  await Promise.all([fetchStudentById(), fetchRewards()]);
});

// Watchers
watch([searchQuery], fetchRewards);
</script>

<template>
  <v-container>
    <CardHeader
      :label="`Redeem rewards for ${student?.user?.fullName || 'Student'}`"
      :add-button="false"
      @changed="handleSearchChange"
      @toggle-filters="showFilters = !showFilters"
    ></CardHeader>
    <div class="d-flex justify-end mb-4">
      <v-btn
        rounded="xl"
        color="backgroundDarken"
        :disabled="!student?.id"
        @click="openRedemptionHistory"
      >
        Previous Redemptions
      </v-btn>
    </div>
    <CardTable
      :items="rewards"
      :sort-options="sortOptions"
      :show-filters="showFilters"
      @close-filter-menu="showFilters = false"
      @clear-filters="handleClearFilters"
      @update-filters="handleChangeFilters"
    >
      <template #item="{ item }">
        <RewardCard
          :key="item.id"
          :reward="item"
          :is-view="false"
          variant="redeem"
          :student-points="studentPoints"
          :student="student"
          @redeem="handleRedeem"
        ></RewardCard>
      </template>
      <template #pagination>
        <v-pagination
          v-model="page"
          :length="count"
          :total-visible="$vuetify.display.smAndDown ? 3 : 5"
          class="mt-4"
          @next="fetchRewards"
          @prev="fetchRewards"
          @update:model-value="fetchRewards"
        >
        </v-pagination>
      </template>
      <template #filters>
        <SortSelect
          v-model="sortOptions"
          :sort-options="sortProperties"
        ></SortSelect>
      </template>
    </CardTable>
  </v-container>
  <v-dialog
    v-model="showRedemptionDialog"
    max-width="600"
    transition="dialog-bottom-transition"
  >
    <v-card class="rounded-lg bg-backgroundDarken">
      <v-card-title class="text-center"
        >Redeem {{ selectedReward?.name }} for
        {{ student?.user?.fullName }}</v-card-title
      >

      <v-card-text class="text-center">
        <v-fade-transition mode="out-in">
          <v-alert
            v-if="dialogState === 'success'"
            color="success"
            variant="outlined"
            >Reward redeemed successfully</v-alert
          >
          <v-alert
            v-else-if="dialogState === 'error'"
            color="error"
            variant="outlined"
            >Error redeeming reward</v-alert
          >
          <div v-else>
            <p>Cost: {{ selectedReward.points }} points</p>
            <p>Current Points: {{ studentPoints }}</p>
            <p>
              Remaining Points:
              {{ studentPoints - selectedReward.points }}
            </p>
            <div class="d-flex justify-center mt-10">
              <v-btn
                color="primary"
                class="rounded-lg"
                @click="handleRedeemConfirm"
                >Confirm</v-btn
              >
              <v-btn
                class="rounded-lg ml-2"
                color="text"
                variant="outlined"
                @click="showRedemptionDialog = false"
                >Cancel</v-btn
              >
            </div>
          </div>
        </v-fade-transition>
      </v-card-text>
    </v-card>
  </v-dialog>
  <v-dialog
    v-model="showRedemptionHistoryDialog"
    scrollable
    max-width="800"
    transition="dialog-bottom-transition"
  >
    <v-card class="rounded-lg bg-backgroundDarken" max-height="80vh">
      <v-card-title class="text-center">
        Previous Redemptions for {{ student?.user?.fullName || "Student" }}
      </v-card-title>
      <p
        v-if="!loadingRedemptionHistory && redemptionHistory.length > 0"
        class="text-center font-weight-bold px-4 pb-2"
      >
        Total Points Redeemed: {{ totalRedeemedPoints }}
      </p>
      <v-card-text class="redemption-history-list">
        <div v-if="loadingRedemptionHistory" class="d-flex justify-center py-6">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <p v-else-if="redemptionHistory.length === 0" class="text-center py-4">
          No previous redemptions for this student.
        </p>
        <v-table v-else>
          <thead>
            <tr>
              <th class="text-left">Reward</th>
              <th class="text-left">Date</th>
              <th class="text-left">Points</th>
              <th class="text-left">Fulfilled By</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="redemption in redemptionHistory" :key="redemption.id">
              <td>{{ redemption.reward?.name || "Unknown reward" }}</td>
              <td>{{ formatRedemptionDate(redemption.date) }}</td>
              <td>{{ redemption.pointsDeducted ?? redemption.reward?.points ?? 0 }}</td>
              <td>
                {{
                  redemption.fulfilledBy?.fullName ||
                  [redemption.fulfilledBy?.fName, redemption.fulfilledBy?.lName]
                    .filter(Boolean)
                    .join(" ") ||
                  "—"
                }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td class="font-weight-bold">Total</td>
              <td></td>
              <td class="font-weight-bold">{{ totalRedeemedPoints }}</td>
              <td></td>
            </tr>
          </tfoot>
        </v-table>
      </v-card-text>
      <v-card-actions class="justify-center pb-4">
        <v-btn
          rounded="xl"
          color="text"
          variant="outlined"
          @click="showRedemptionHistoryDialog = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.redemption-history-list {
  max-height: 55vh;
  overflow-y: auto;
}
</style>
