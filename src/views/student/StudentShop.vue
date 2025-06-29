<script setup>
import { ref, computed, watch } from "vue";
import { useDisplay } from "vuetify";
import CardTable from "../../components/CardTable.vue";
import CardHeader from "../../components/CardHeader.vue";
import rewardServices from "../../services/rewardServices";
import RewardCard from "../../components/cards/RewardCard.vue";
import { userStore } from "../../stores/userStore";
import studentServices from "../../services/studentServices";
const store = userStore();
const userId = computed(() => store.user.userId);

const rewards = ref([]);
const totalPages = ref(0);
const searchQuery = ref("");
const page = ref(1);
const showReward = ref(false);
const rewardToShow = ref({});
const points = ref(0);

const display = useDisplay();
const numCardColumns = computed(() => {
  if (display.xxl.value) return 4;
  if (display.xl.value) return 3;
  if (display.lg.value) return 3;
  if (display.md.value) return 2;
  if (display.sm.value) return 1;
  return 1; // Default for xs
});
const pageSize = computed(() => numCardColumns.value * 2);

const fetchRewards = async () => {
  const response = await rewardServices.getAllRewards(
    page.value,
    pageSize.value,
    searchQuery.value,
  );
  rewards.value = response.data.rewards;
  totalPages.value = response.data.count;
};

const fetchPoints = async () => {
  const student = await studentServices.getStudentForUserId(userId.value);
  console.log(student.data);
  points.value = student.data.pointsAwarded - student.data.pointsUsed;
};

const handleSearch = async (query) => {
  searchQuery.value = query;
  await fetchRewards();
};

const handleShowReward = (reward) => {
  rewardToShow.value = reward;
  showReward.value = true;
};

watch(userId, () => fetchPoints(), { immediate: true });
watch([page, searchQuery], () => fetchRewards(), { immediate: true });
</script>
<template>
  <v-container fluid>
    <v-row class="ml-5">
      <CardHeader
        :label="`Points: ${points}`"
        :add-button="false"
        :filter-button="false"
        @changed="handleSearch"
      >
      </CardHeader>
    </v-row>

    <CardTable
      :items="rewards"
      :total-pages="totalPages"
      :show-info="showReward"
      :info-label="rewardToShow.name"
      @close-info="showReward = false"
    >
      <template #item="{ item }">
        <RewardCard :reward="item" @show="handleShowReward" />
      </template>
      <template #pagination>
        <v-pagination v-model="page" :length="totalPages" />
      </template>
      <template #info>
        <p class="text-h6 mt-2">Description:</p>
        <p class="mb-2 text-subtitle-1">
          {{ rewardToShow.description }}
        </p>
        <p class="text-h6">Points:</p>
        <p class="mb-2 text-subtitle-1">{{ rewardToShow.points }} pts</p>

        <p class="text-h6">Avaliable Quantity:</p>
        <p class="mb-2 text-subtitle-1">
          {{ `${ rewardToShow.quantityAvaliable !== null ? rewardToShow.quantityAvaliable > 0 ? rewardToShow.quantityAvaliable : "None" : "Unlimited Quantity"} Avaliable`}} </p>
        <em><p v-if="rewardToShow.quantityAvaliable <= 0 && rewardToShow.quantityAvaliable !== null "class="mb-2 text-subtitle-1">Please check back soon to see if this item is back in stock</p></em>

        <p class="text-h6">Redeem at:</p>
        <p class="mb-2 text-subtitle-1">
          This reward can be redeemed by visiting the Career Services office.
        </p>
      </template>
    </CardTable>
  </v-container>
</template>
