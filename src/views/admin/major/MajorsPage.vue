<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import majorServices from "../../../services/majorServices";
import MajorCard from "../../../components/cards/MajorCard.vue";
import CardTable from "../../../components/CardTable.vue";
import CardHeader from "../../../components/CardHeader.vue";
import { useDisplay } from "vuetify";
import SortSelect from "../../../components/SortSelect.vue";

// Constants
const label = "Majors";

const sortProperties = [
  {
    title: "Name",
    value: "name",
  },
];

// Reactive states
const router = useRouter();
const majors = ref([]);
const page = ref(1);
const searchQuery = ref("");
const count = ref(0);
const showErrorModal = ref(false);
const errorMessage = ref("");

const loading = ref(false);

const showFilters = ref(false);
const filters = ref({});

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

// Fetch majors
const getMajors = async (pageNumber = page.value) => {
  loading.value = true;
  try {
    const result = await majorServices.getAllMajors(
      pageNumber,
      pageSize.value,
      searchQuery.value,
      { ...filters.value, ...sortOptions.value },
    );
   
    majors.value = result.data.majors;
    count.value = result.data.count;
  } catch (error) {
    console.error("Error fetching majors:", error);
  } finally {
    loading.value = false;
  }
};

// Handlers
const handleAdd = () => router.push({ name: "addMajor" });
const handleEdit = (majorId) =>
  router.push({ name: "editMajor", params: { id: majorId } });

const handleDelete = async (majorId) => {
  try {
    await majorServices.deleteMajor(majorId);
    await getMajors(); // Re-fetch majors after delete
  } catch (error) {
    console.error("Error deleting major:", error);
    errorMessage.value =
      error.response?.data?.message ||
      "Cannot delete major that is assigned to students";
    showErrorModal.value = true;
  }
};

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1; // Reset to first page on search change
  getMajors();
};

const handleChangeFilters = () => {
  getMajors();
};

const handleClearFilters = () => {
  filters.value = {};
  getMajors();
};

// Initial fetch
watch(showFilters, () => getMajors());
onMounted(() => {
  getMajors();
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
      :items="majors"
      :show-filters="showFilters"
      :per-row-lg="showFilters ? 3 : 4"
      :per-row-md="showFilters ? 2 : 3"
      :per-row-sm="showFilters ? 1 : 2"
      @update-filters="handleChangeFilters"
      @clear-filters="handleClearFilters"
      @close-filter-menu="showFilters = false"
    >
      <template #item="{ item }">
        <MajorCard
          :major="item"
          @edit="handleEdit"
          @delete="handleDelete"
        ></MajorCard>
      </template>
      <template #filters>
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
          @next="getMajors"
          @prev="getMajors"
          @update:model-value="getMajors"
        >
        </v-pagination>
      </template>
    </CardTable>

    <!-- Error Modal -->
    <v-dialog v-model="showErrorModal" max-width="500">
      <v-card rounded="xl" class="pa-4" color="backgroundDarken">
        <v-card-title class="text-h5">Error</v-card-title>
        <v-card-text>{{ errorMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showErrorModal = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
