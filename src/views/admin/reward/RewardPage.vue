<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import rewardServices from "../../../services/rewardServices";
import RewardCard from "../../../components/cards/RewardCard.vue";
import CardHeader from "../../../components/CardHeader.vue";
import CardTable from "../../../components/CardTable.vue";
import { useDisplay } from "vuetify";
import SortSelect from "../../../components/SortSelect.vue";

// Constants
const label = "Rewards";

const sortProperties = [
  {
    title: "Redemption Type",
    value: "redemptionType",
  },
];

// Reactive states
const router = useRouter();
const rewards = ref([]);
const page = ref(1);
const searchQuery = ref("");
const count = ref(0);

const showFilters = ref(false);
const filters = ref({
  redemptionType: null,
});

const sortOptions = ref({
  sortAttribute: sortProperties[0].value,
  sortDirection: "asc",
});

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
  try {
    const result = await rewardServices.getAllRewards(
      page.value,
      pageSize.value,
      searchQuery.value,
      { ...filters.value, ...sortOptions.value },
    );
    rewards.value = result.data.rewards || [];
    count.value = result.data.count || 0;
  } catch (error) {
    console.error("Error fetching rewards:", error);
  }
};

// Handlers
const handleAdd = () => {
  router.push({ name: "addReward" });
};
const handleEdit = (rewardId) =>
  router.push({ name: "editReward", params: { id: rewardId } });
const handleShop = (rewardId) => {
  router.push({ name: "redeemReward", params: { id: rewardId } });
};

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1; // Reset to first page on search change
};

const handleChangeFilters = () => {
  getRewards();
};
const handleClearFilters = () => {
  filters.value = {
    redemptionType: null,
  };
  getRewards();
};

watch([page, searchQuery, showFilters], getRewards, { immediate: true });
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
        <v-text-field
          v-model="filters.redemptionType"
          label="Redemption Type"
        ></v-text-field>
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
  </v-container>
</template>
