<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import experienceServices from "../../services/experienceServices";
import ExperienceCard from "../../components/cards/ExperienceCard.vue";
import CardTable from "../../components/CardTable.vue";
import CardHeader from "../../components/CardHeader.vue";
import SortSelect from "../../components/SortSelect.vue";

// Constants
const PAGE_SIZE = 8;
const label = "Experiences";

const sortProperties = [
  { title: "Name", value: "name" },
  { title: "Category", value: "category" },
  { title: "Points", value: "points" },
  { title: "Semesters from Graduation", value: "semestersFromGrad" }, // Added sort option
];

// Semester label → value mapping
const semesterOptions = [
  { label: "Freshman 1", value: 8 },
  { label: "Freshman 2", value: 7 },
  { label: "Sophomore 1", value: 6 },
  { label: "Sophomore 2", value: 5 },
  { label: "Junior 1", value: 4 },
  { label: "Junior 2", value: 3 },
  { label: "Senior 1", value: 2 },
  { label: "Senior 2", value: 1 },
];

// Reactive states
const router = useRouter();
const experiences = ref([]);
const page = ref(1);
const searchQuery = ref("");
const count = ref(0);
const showFilters = ref(false);
const filters = ref({
  category: null,
  schedulingType: null,
  submissionType: null,
  status: null,
  semestersFromGrad: null, // Added semester filter
});
const sortOptions = ref({
  sortAttribute: sortProperties[0].value,
  sortDirection: "asc", // Default ascending
});

// Add these refs for filter options
const categories = ref([]);
const schedulingTypes = ref([]);
const submissionTypes = ref([]);
const statusTypes = ref(["active", "inactive"]);

// Fetch experiences
const getExperiences = async (pageNumber = page.value) => {
  try {
    const result = await experienceServices.getAllExperiences(
      pageNumber,
      PAGE_SIZE,
      searchQuery.value,
      {
        ...filters.value,
        ...sortOptions.value,
      },
    );

    experiences.value = result.data.experiences;
    count.value = result.data.count;
  } catch (error) {
    console.error("Error fetching experiences:", error);
  }
};

// Add filter handlers
const handleChangeFilters = () => {
  page.value = 1;
  getExperiences();
};

const handleClearFilters = () => {
  filters.value = {
    category: null,
    schedulingType: null,
    submissionType: null,
    status: null,
    semestersFromGrad: null, // Reset semester filter
  };
  sortOptions.value = {
    sortAttribute: sortProperties[0].value,
    sortDirection: "asc",
  };
  getExperiences();
};

// Add fetchFilterOptions function
const fetchFilterOptions = async () => {
  try {
    const [categoriesData, schedulingTypesData, submissionTypesData] =
      await Promise.all([
        experienceServices.getCategories(),
        experienceServices.getSchedulingTypes(),
        experienceServices.getSubmissionTypes(),
      ]);

    categories.value = categoriesData.data;
    schedulingTypes.value = schedulingTypesData.data;
    submissionTypes.value = submissionTypesData.data;
  } catch (error) {
    console.error("Error fetching filter options:", error);
  }
};

// Handlers
const handleAdd = () => router.push({ name: "addExperience" });
const handleEdit = (experienceId) =>
  router.push({ name: "editExperience", params: { id: experienceId } });

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1; // Reset to first page on search change
  getExperiences(page.value);
};

// Add this handler
const handleCloseFilters = () => {
  showFilters.value = false;
};

// Initial fetch
onMounted(async () => {
  await fetchFilterOptions();
  getExperiences();
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
      :items="experiences"
      :per-row-lg="showFilters ? 3 : 4"
      :per-row-md="showFilters ? 2 : 3"
      :per-row-sm="showFilters ? 1 : 2"
      :show-filters="showFilters"
      @update-filters="handleChangeFilters"
      @clear-filters="handleClearFilters"
      @close-filter-menu="handleCloseFilters"
    >
      <template #filters>
        <v-select
          v-model="filters.category"
          :items="categories"
          label="Category"
          clearable
          @update:model-value="handleChangeFilters"
        ></v-select>

        <v-select
          v-model="filters.schedulingType"
          :items="schedulingTypes"
          label="Scheduling Type"
          clearable
          @update:model-value="handleChangeFilters"
        ></v-select>

        <v-select
          v-model="filters.submissionType"
          :items="submissionTypes"
          label="Submission Type"
          clearable
          @update:model-value="handleChangeFilters"
        ></v-select>

        <v-select
          v-model="filters.semestersFromGrad"
          :items="semesterOptions"
          item-title="label"
          item-value="value"
          label="Semester from Graduation"
          clearable
          @update:model-value="handleChangeFilters"
        ></v-select>

        <v-select
          v-model="filters.status"
          :items="statusTypes"
          label="Status"
          clearable
          @update:model-value="handleChangeFilters"
        ></v-select>

        <SortSelect
          v-model="sortOptions"
          :sort-options="sortProperties"
          @update:model-value="handleChangeFilters"
        ></SortSelect>
      </template>

      <template #item="{ item }">
        <ExperienceCard
          :experience="item"
          @edit="handleEdit"
          @delete="handleDelete"
        ></ExperienceCard>
      </template>
    </CardTable>

    <v-pagination
      v-model="page"
      :length="count"
      :total-visible="$vuetify.display.smAndDown ? 3 : 5"
      class="m-2"
      @next="getExperiences"
      @prev="getExperiences"
      @update:model-value="getExperiences"
    ></v-pagination>
  </v-container>
</template>
