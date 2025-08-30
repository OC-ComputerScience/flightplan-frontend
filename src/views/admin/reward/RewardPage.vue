<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import rewardServices from "../../../services/rewardServices";
import RewardCard from "../../../components/cards/RewardCard.vue";
import RewardAddEditDialog from "./RewardAddEditDialog.vue";
import CardHeader from "../../../components/CardHeader.vue";
import CardTable from "../../../components/CardTable.vue";
import { useDisplay } from "vuetify";
import SortSelect from "../../../components/SortSelect.vue";

// Constants
const label = "Rewards";

const sortProperties = [
  {
    title: "Name",
    value: "name",
  },
  {
    title: "Points",
    value: "points",
  },
  {
    title: "Redemption Type",
    value: "redemptionType",
  },
];

// Reactive states
const showRewardDialog = ref(false);
const isAddMode = ref(true);
const selectedRewardId = ref(null);

const router = useRouter();
const rewards = ref([]);
const page = ref(1);
const searchQuery = ref("");
const count = ref(0);
const loading = ref(false);

const showFilters = ref(false);
const filters = ref({
  redemptionType: null,
  status: null,
  minPoints: null,
  maxPoints: null,
});

const sortOptions = ref({
  sortAttribute: sortProperties[0].value,
  sortDirection: "asc",
});

const redemptionTypes = ref(["In-Person", "Digital"]);

const display = useDisplay();

const numCardColumns = computed(() => {
  if (display.xxl.value) return 4;
  if (display.xl.value || display.lg.value) return showFilters.value ? 3 : 4;
  if (display.md.value) return showFilters.value ? 2 : 3;
  if (display.sm.value) return showFilters.value ? 1 : 2;
  return 1; // Default for xs
});
const pageSize = computed(() => numCardColumns.value * 3);

// Fetch rewards
const getRewards = async () => {
  loading.value = true;
  try {
    const result = await rewardServices.getAllRewards(
      page.value,
      pageSize.value,
      searchQuery.value,
      {
        ...filters.value,
        ...sortOptions.value,
      },
    );
    rewards.value = result.data.rewards || [];
    count.value = result.data.count || 0;
  } catch (error) {
    console.error("Error fetching rewards:", error);
  } finally {
    loading.value = false;
  }
};

// Obsolete function? no getRedemptionTypes in rewardServices
// const getRedemptionTypes = async () => {
//   try {
//     const response = await rewardServices.getRedemptionTypes();
//     redemptionTypes.value = response.data;
//   } catch (error) {
//     console.error("Error fetching redemption types:", error);
//   }
// };

// Handlers
const handleAdd = () => {
  isAddMode.value = true;
  selectedRewardId.value = null;
  showRewardDialog.value = true;
};

const handleEdit = (rewardId) => {
  isAddMode.value = false;
  selectedRewardId.value = rewardId;
  showRewardDialog.value = true;
};

const handleDialogSaved = () => {
  showRewardDialog.value = false;
  getRewards();
};

const handleShop = (rewardId) => {
  router.push({ name: "redeemReward", params: { id: rewardId } });
};

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1; // Reset to first page on search change
};

const handleChangeFilters = () => {
  // Convert points to numbers
  if (filters.value.minPoints) {
    filters.value.minPoints = Number(filters.value.minPoints);
  }
  if (filters.value.maxPoints) {
    filters.value.maxPoints = Number(filters.value.maxPoints);
  }
  getRewards();
};
const handleClearFilters = () => {
  filters.value = {
    redemptionType: null,
    status: null,
    minPoints: null,
    maxPoints: null,
  };
  getRewards();
};

watch([page, searchQuery, showFilters], getRewards, { immediate: true });

onMounted(() => {
  getRewards();
  //getRedemptionTypes();
});
</script>
<template>
  <v-container fluid>
    <CardHeader
      :label="label"
      @changed="handleSearchChange"
      @add="handleAdd"
      @toggle-filters="showFilters = !showFilters"
    ></CardHeader>
    <CardTable
      :items="rewards"
      :per-row-lg="showFilters ? 3 : 4"
      :per-row-md="showFilters ? 2 : 3"
      :per-row-sm="showFilters ? 1 : 2"
      :show-filters="showFilters"
      @update-filters="handleChangeFilters"
      @clear-filters="handleClearFilters"
      @close-filter-menu="showFilters = false"
    >
      <template #item="{ item }">
        <RewardCard
          :key="item.id"
          :reward="item"
          :is-view="false"
          :maintenance-view="true"
          @shop="handleShop"
          @edit="handleEdit"
        ></RewardCard>
      </template>
      <template #filters>
        <v-select
          v-model="filters.redemptionType"
          :items="redemptionTypes"
          label="Redemption Type"
          clearable
          @update:model-value="getRewards"
        ></v-select>
        <v-select
          v-model="filters.status"
          :items="['active', 'inactive']"
          label="Status"
          clearable
          @update:model-value="getRewards"
        ></v-select>
        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model="filters.minPoints"
              type="number"
              label="Min Points"
              clearable
              @update:model-value="getRewards"
            ></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="filters.maxPoints"
              type="number"
              label="Max Points"
              clearable
              @update:model-value="getRewards"
            ></v-text-field>
          </v-col>
        </v-row>
        <SortSelect
          v-model="sortOptions"
          :sort-options="sortProperties"
        ></SortSelect>
      </template>

      <template #pagination>
        <v-pagination
          v-model="page"
          :length="count"
          :total-visible="$vuetify.display.smAndDown ? 3 : 5"
          class="m-2"
          @next="getRewards"
          @prev="getRewards"
          @update:model-value="getRewards"
        >
        </v-pagination>
      </template>
    </CardTable>
    <RewardAddEditDialog
      v-model="showRewardDialog"
      :is-add="isAddMode"
      :reward-id="selectedRewardId"
      @saved="handleDialogSaved"
    />
  </v-container>
</template>
