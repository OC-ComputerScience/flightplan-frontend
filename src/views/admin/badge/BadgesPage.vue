<script setup>
import { ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import CardTable from "../../../components/CardTable.vue";
import CardHeader from "../../../components/CardHeader.vue";
import BadgeCard from "../../../components/cards/BadgeCard.vue";
import badgeServices from "../../../services/badgeServices";

// Constants
const PAGE_SIZE = 8;
const label = "Badges";
const sortProperties = [
  { title: "Name", value: "name" },
  { title: "Status", value: "status" },
  { title: "Rule Type", value: "ruleType" },
];

// Reactive states
const router = useRouter();
const badges = ref([]);
const page = ref(1);
const searchQuery = ref("");
const showFilters = ref(false);
const count = ref(0);
const filters = ref({
  status: null,
  ruleType: null,
});
const ruleTypes = ref([]);
const statuses = ref([]);
const sortOptions = ref({
  sortAttribute: sortProperties[0].value,
  sortDirection: "asc",
});

// Handlers
const handleAdd = () => {
  router.push({ name: "addBadge" });
};
const handleEdit = (badgeId) =>
  router.push({ name: "editBadge", params: { id: badgeId } });

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1; // Reset to first page on search change
  getBadges(page.value, searchQuery.value);
};

const handleChangeFilters = () => {
  page.value = 1;
  getBadges();
};

const handleClearFilters = () => {
  filters.value = {
    status: null,
    ruleType: null,
  };
  sortOptions.value = {
    sortAttribute: sortProperties[0].value,
    sortDirection: "asc",
  };
  page.value = 1; // Reset to first page on clear filters
  getBadges();
};

// Fetch badges
const getBadges = async (
  pageNumber = page.value,
  query = searchQuery.value,
) => {
  try {
    const result = await badgeServices.getAllBadges(
      pageNumber,
      PAGE_SIZE,
      query,
      {
        ...filters.value,
        ...sortOptions.value,
      },
    );
    badges.value = result.data.badges || [];
    count.value = result.data.count || 0;
  } catch (error) {
    console.error("Error fetching badges:", error);
  }
};

const fetchFilterOptions = async () => {
  try {
    const [ruleTypesResponse, statusTypesResponse] = await Promise.all([
      badgeServices.getRuleTypes(),
      badgeServices.getStatusTypes(),
    ]);
    ruleTypes.value = ruleTypesResponse.data;
    statuses.value = statusTypesResponse.data;
  } catch (error) {
    console.error("Error fetching filter options:", error);
  }
};

// Watch for changes in page and search query
watch([page, searchQuery], () => getBadges(page.value, searchQuery.value), {
  immediate: true,
});

watch(filters, () => handleChangeFilters(), { deep: true });

// Initial fetch
onMounted(() => {
  fetchFilterOptions();
  getBadges();
});
</script>
<template>
  <v-container fluid>
    <CardHeader
      :label="label"
      :filter-button="true"
      @changed="handleSearchChange"
      @add="handleAdd"
      @toggle-filters="showFilters = !showFilters"
    ></CardHeader>

    <CardTable
      :items="badges"
      :per-row-lg="4"
      :per-row-md="3"
      :per-row-sm="2"
      :show-filters="showFilters"
      @update-filters="handleChangeFilters"
      @clear-filters="handleClearFilters"
      @close-filter-menu="showFilters = false"
    >
      <template #filters>
        <v-select
          v-model="filters.status"
          :items="statuses"
          label="Status"
          clearable
          @update:model-value="getBadges"
        ></v-select>

        <v-select
          v-model="filters.ruleType"
          :items="ruleTypes"
          label="Rule Type"
          clearable
          @update:model-value="getBadges"
        ></v-select>

        <SortSelect
          v-model="sortOptions"
          :sort-options="sortProperties"
          @update:model-value="handleChangeFilters"
        ></SortSelect>
      </template>

      <template #item="{ item }">
        <BadgeCard :key="item.id" :badge="item" @edit="handleEdit"></BadgeCard>
      </template>
    </CardTable>

    <v-pagination
      v-model="page"
      :length="count"
      :total-visible="$vuetify.display.smAndDown ? 3 : 5"
      class="m-2"
      @next="getBadges"
      @prev="getBadges"
      @update:model-value="getBadges"
    ></v-pagination>
  </v-container>
</template>
