<script setup>
import { ref, onMounted, computed, watch } from "vue";
import semesterServices from "../../../services/semesterServices";
import SemesterCard from "../../../components/cards/SemesterCard.vue";
import SemesterAddEditDialog from "./SemesterAddEditDialog.vue";
import CardTable from "../../../components/CardTable.vue";
import CardHeader from "../../../components/CardHeader.vue";
import { useDisplay } from "vuetify";
import SortSelect from "../../../components/SortSelect.vue";

const label = "Semesters";

const sortProperties = [
  { title: "Start Date", value: "startDate" },
  { title: "End Date", value: "endDate" },
  { title: "Year", value: "year" },
  { title: "Term", value: "term" },
];

const showSemesterDialog = ref(false);
const isAddMode = ref(true);
const selectedSemesterId = ref(null);
const semesters = ref([]);
const page = ref(1);
const searchQuery = ref("");
const count = ref(0);
const showErrorModal = ref(false);
const errorMessage = ref("");
const loading = ref(false);
const showFilters = ref(false);

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
  return 1;
});
const pageSize = computed(() => numCardColumns.value * 3);

const getSemesters = async (pageNumber = page.value) => {
  loading.value = true;
  try {
    const result = await semesterServices.getAllSemestersForAdmin(
      pageNumber,
      pageSize.value,
      searchQuery.value,
      {
        ...sortOptions.value,
        sortAttribute: "startDate",
        sortDirection: "asc",
      },
    );

    if (result.data.error) {
      throw new Error(result.data.error);
    }

    semesters.value = [...(result.data.semesters || [])].sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate),
    );
    count.value = result.data.count;
  } catch (error) {
    console.error("Error fetching semesters:", error);
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  isAddMode.value = true;
  selectedSemesterId.value = null;
  showSemesterDialog.value = true;
};

const handleEdit = (semesterId) => {
  isAddMode.value = false;
  selectedSemesterId.value = semesterId;
  showSemesterDialog.value = true;
};

const handleDialogSaved = () => {
  showSemesterDialog.value = false;
  getSemesters();
};

const handleDelete = async (semesterId) => {
  try {
    await semesterServices.deleteSemester(semesterId);
    await getSemesters();
  } catch (error) {
    console.error("Error deleting semester:", error);
    errorMessage.value =
      error.response?.data?.message ||
      "Cannot delete a semester that has flight plans";
    showErrorModal.value = true;
  }
};

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1;
  getSemesters();
};

const handleChangeFilters = () => {
  page.value = 1;
  getSemesters();
};

const handleClearFilters = () => {
  sortOptions.value = {
    sortAttribute: sortProperties[0].value,
    sortDirection: "asc",
  };
  getSemesters();
};

watch(showFilters, () => getSemesters());
onMounted(() => {
  getSemesters();
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
      :items="semesters"
      :show-filters="showFilters"
      :per-row-lg="showFilters ? 3 : 4"
      :per-row-md="showFilters ? 2 : 3"
      :per-row-sm="showFilters ? 1 : 2"
      @update-filters="handleChangeFilters"
      @clear-filters="handleClearFilters"
      @close-filter-menu="showFilters = false"
    >
      <template #item="{ item }">
        <SemesterCard
          :semester="item"
          @edit="handleEdit"
          @delete="handleDelete"
        ></SemesterCard>
      </template>

      <template #filters>
        <SortSelect
          v-model="sortOptions"
          :sort-options="sortProperties"
          @update:model-value="handleChangeFilters"
        ></SortSelect>
      </template>

      <template #pagination>
        <v-pagination
          v-model="page"
          :length="count"
          :total-visible="$vuetify.display.smAndDown ? 3 : 5"
          class="m-2"
          @next="getSemesters"
          @prev="getSemesters"
          @update:model-value="getSemesters"
        ></v-pagination>
      </template>
    </CardTable>

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
    <SemesterAddEditDialog
      v-model="showSemesterDialog"
      :is-add="isAddMode"
      :semester-id="selectedSemesterId"
      @saved="handleDialogSaved"
    />
  </v-container>
</template>
