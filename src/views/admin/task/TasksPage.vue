<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import taskServices from "../../../services/taskServices";
import TaskCard from "../../../components/cards/TaskCard.vue";
import CardTable from "../../../components/CardTable.vue";
import CardHeader from "../../../components/CardHeader.vue";
import { useDisplay } from "vuetify";
import strengthServices from "../../../services/strengthServices";
import SortSelect from "../../../components/SortSelect.vue";

// Constants
const label = "Tasks";

const sortProperties = [
  {
    title: "Semesters from Graduation",
    value: "semestersFromGraduation",
  },
  {
    title: "Name",
    value: "name",
  },
  {
    title: "Points Earned",
    value: "pointsEarned",
  },
];

// Reactive states
const router = useRouter();
const tasks = ref([]);
const page = ref(1);
const searchQuery = ref("");
const count = ref(0);

const strengths = ref([]);
const categories = ref([]);
const schedulingTypes = ref([]);
const submissionTypes = ref([]);
const showFilters = ref(false);
const filters = ref({
  category: null,
  schedulingType: null,
  completionType: null,
  semestersFromGraduation: null,
  strengths: null,
});

const sortOptions = ref({
  sortAttribute: sortProperties[0].value,
  sortDirection: "asc",
});

const display = useDisplay();

const numCardColumns = computed(() => {
  if (display.xxl.value) return 3;
  if (display.xl.value) return showFilters.value ? 2 : 3;
  if (display.lg.value) return showFilters.value ? 2 : 3;
  if (display.md.value) return 2;
  if (display.sm.value) return showFilters.value ? 1 : 2;
  return 1; // Default for xs
});
const pageSize = computed(() => numCardColumns.value * 2);

// Fetch tasks
const getTasks = async (pageNumber = page.value) => {
  try {
    const result = await taskServices.getAllTasks(
      pageNumber,
      pageSize.value,
      searchQuery.value,
      { ...filters.value, ...sortOptions.value },
    );
    tasks.value = result.data.tasks;
    count.value = result.data.count;
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
};

const getStrengths = () => {
  strengthServices.getAllStrengths().then((response) => {
    strengths.value = response.data;
  });
};

// Handlers
const handleAdd = () => router.push({ name: "addTask" });
const handleEdit = (taskId) =>
  router.push({ name: "editTask", params: { id: taskId } });

const handleDelete = async (taskId) => {
  try {
    await taskServices.deleteTask(taskId);
    await getTasks(); // Re-fetch tasks after delete
  } catch (error) {
    console.error("Error deleting task:", error);
  }
};

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1; // Reset to first page on search change
  getTasks();
};

const handleChangeFilters = () => {
  if (filters.value.strengths && filters.value.strengths.length > 0) {
    filters.value.strengths = filters.value.strengths.map(
      (strength) => strength.id,
    );
  }
  getTasks();
};
const handleClearFilters = () => {
  filters.value = {
    startDate: null,
    endDate: null,
    location: null,
  };
  getTasks();
};

// Initial fetch
watch(showFilters, () => getTasks());
onMounted(async () => {
  getTasks();
  getStrengths();
  const [categoriesRes, schedulingRes, submissionTypesRes] = await Promise.all([
    taskServices.getCategories(),
    taskServices.getSchedulingTypes(),
    taskServices.getSubmissionTypes(),
  ]);

  categories.value = categoriesRes.data;
  schedulingTypes.value = schedulingRes.data;
  submissionTypes.value = submissionTypesRes.data;
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
      :items="tasks"
      :show-filters="showFilters"
      :per-row-lg="showFilters ? 2 : 3"
      :per-row-md="2"
      :per-row-sm="showFilters ? 1 : 2"
      @update-filters="handleChangeFilters"
      @clear-filters="handleClearFilters"
      @close-filter-menu="showFilters = false"
    >
      <template #item="{ item }">
        <TaskCard
          :task="item"
          @edit="handleEdit"
          @delete="handleDelete"
        ></TaskCard>
      </template>
      <template #filters>
        <v-combobox
          v-model="filters.strengths"
          :items="strengths"
          item-title="name"
          item-value="id"
          label="Strengths"
          multiple
          chips
          clearable
        ></v-combobox>
        <v-select
          v-model="filters.category"
          label="Category"
          :items="categories"
        ></v-select>
        <v-select
          v-model="filters.schedulingType"
          label="Scheduling Type"
          :items="schedulingTypes"
        ></v-select>
        <v-select
          v-model="filters.submissionType"
          label="Submission Type"
          :items="submissionTypes"
        ></v-select>
        <v-text-field
          v-model="filters.semestersFromGraduation"
          type="number"
          label="Semesters from Graduation"
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
          @next="getTasks"
          @prev="getTasks"
          @update:model-value="getTasks"
        >
        </v-pagination>
      </template>
    </CardTable>
  </v-container>
</template>
