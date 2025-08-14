<script setup>
import CardHeader from "../../components/CardHeader.vue";
import CardTable from "../../components/CardTable.vue";
import taskServices from "../../services/taskServices";
import flightPlanItemServices from "../../services/flightPlanItemServices";
import FlightPlanItemApprovalCard from "../../components/cards/FlightPlanItemApprovalCard.vue";
import TaskCard from "../../components/cards/TaskCard.vue";
import ViewApprovalDialog from "../../components/dialogs/ViewApprovalDialog.vue";
import UploadCSVDialog from "../../components/dialogs/UploadCSVDialog.vue";
import { ref, onMounted, computed, watch } from "vue";
import { adminApprovalDialogStore } from "../../stores/adminApprovalDialogStore";
import { uploadCSVDialogStore } from "../../stores/uploadCSVDialogStore";
import { useDisplay } from "vuetify";
import { useRoute } from "vue-router";
import { semesters } from "../../utils/semesterFormatter";

const route = useRoute();
const specificIdParam = !!route.query.id;

const dialogStore = adminApprovalDialogStore();
const csvDialogStore = uploadCSVDialogStore();

const pendingApprovals = ref([]);
const page = ref(1);
const count = ref(1);
const searchQuery = ref("");

const display = useDisplay();

const selectedSemester = ref(null);
const taskSearchQuery = ref("");
const tasks = ref([]);
const selectedTask = ref(null);
const csvSuccessMessage = ref("");
const loadingApproveStudents = ref(false);

const numCardColumns = computed(() => {
  if (display.xxl.value) return 4;
  if (display.xl.value) return 3;
  if (display.lg.value) return 3;
  if (display.md.value) return 2;
  if (display.sm.value) return 1;
  return 1; // Default for xs
});
const pageSize = computed(() => numCardColumns.value * 2);

const fetchPendingApprovals = async () => {
  try {
    const response = await flightPlanItemServices.getPendingApprovals(
      page.value,
      pageSize.value,
      searchQuery.value,
    );
    pendingApprovals.value = response.data.flightPlanItems;
    count.value = response.data.count;
    page.value = 1;
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
  }
};

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1; // Reset to first page on search change
};

const handleTaskSearchChange = (input) => {
  taskSearchQuery.value = input;
};

const handleApprove = (flightPlanItem) => {
  dialogStore.setFlightPlanItem(flightPlanItem);
  dialogStore.toggleVisibility();
};

const selectSemester = (semester) => {
  selectedSemester.value = semester;
  loadTasksForSemester();
};

const loadTasksForSemester = async () => {
  const semester = selectedSemester.value.value;
  tasks.value = (
    await taskServices.getAllTasks(1, 1000, taskSearchQuery.value, {
      semestersFromGraduation: semester,
      completionType: "Admin CSV Upload",
    })
  ).data.tasks;
  //As of adding CSV uploading funcionality, getAllTasks does not filter out correctly, this filter can be removed in the future if it is fixed
  tasks.value = tasks.value.filter((task) => {
    return (
      task.semestersFromGrad >= semester &&
      task.submissionType === "Admin CSV Upload" &&
      (task?.semesterEnd === null || task.semesterEnd <= semester) &&
      task.status === "active"
    );
  });
};

const selectTask = (task) => {
  selectedTask.value = task;
  csvDialogStore.task = task;
  csvDialogStore.toggleVisibility();
};

const handleSubmitCSV = async (csv) => {
  loadingApproveStudents.value = true;
  const studentEmails = {
    studentEmails: [
      ...csv.map((line) => line[0].replace(/['"<>`\\;, \t]/g, "")),
    ],
  };
  try {
    await flightPlanItemServices.approveFlightPlanItemsForTaskInSemesterForStudents(
      studentEmails,
      selectedTask.value.id,
      selectedSemester.value.value,
    );
    csvSuccessMessage.value = "All Students Approved Successfully";
  } catch (error) {
    csvDialogStore.setError(true);
    csvDialogStore.setErrorMessage(
      error?.response?.data?.message || "Error Approving Students",
    );
  }
  loadingApproveStudents.value = false;
};

watch([page, searchQuery], fetchPendingApprovals);

watch([taskSearchQuery], loadTasksForSemester);

onMounted(async () => {
  let allSubmissions = (await flightPlanItemServices.getPendingApprovals()).data.flightPlanItems;
  await fetchPendingApprovals();
  if (specificIdParam) {
    let foundItem = null;
    allSubmissions.forEach((item) => {
      if (
        item.submission &&
        item.submission.find((sub) => sub.id == route.query.id)
      ) {
        foundItem = item;
        return;
      }
    });

    if (foundItem) {
      handleApprove(foundItem);
    }
  }
});
</script>
<template>
  <v-container>
    <CardHeader
      label="Approvals"
      :add-button="false"
      :filter-button="false"
      @changed="handleSearchChange"
    />
    <CardTable
      :items="pendingApprovals"
      :per-row-lg="3"
      :per-row-md="2"
      :per-row-sm="2"
    >
      <template #item="{ item }">
        <FlightPlanItemApprovalCard
          :flight-plan-item="item"
          @approve="handleApprove(item)"
        />
      </template>
      <template #pagination>
        <v-pagination
          v-model="page"
          :length="count"
          :total-visible="$vuetify.display.smAndDown ? 3 : 5"
          class="mt-4"
          @next="fetchPendingApprovals"
          @prev="fetchPendingApprovals"
          @update:model-value="fetchPendingApprovals"
        >
        </v-pagination>
      </template>
    </CardTable>
    <ViewApprovalDialog
      @approve="fetchPendingApprovals"
      @reject="fetchPendingApprovals"
    />
  </v-container>
  <v-container>
    <h2 class="text-h4">Approval by CSV</h2>
    <h2 class="text-h5">Select Semester</h2>
    <CardTable
      :items="semesters"
      :per-row-lg="4"
      :per-row-md="4"
      :per-row-sm="4"
    >
      <template #item="{ item }">
        <v-card
          class="pa-10 rounded-xl"
          color="backgroundDarken"
          :class="
            item.value == selectedSemester?.value ? 'thick-border' : 'no-border'
          "
          @click="selectSemester(item)"
        >
          <v-card-text color="text" class="text-center text-h5">{{
            item.name
          }}</v-card-text>
        </v-card>
      </template>
    </CardTable>
  </v-container>
  <v-container style="min-height: 600px">
    <CardHeader
      label="Select Task"
      :add-button="false"
      :filter-button="false"
      @changed="handleTaskSearchChange"
    />
    <CardTable :items="tasks" :per-row-lg="4" :per-row-md="4" :per-row-sm="4">
      <template #item="{ item }">
        <TaskCard
          :task="item"
          :approval="true"
          :class="item.id == selectedTask?.id ? 'thick-border' : 'no-border'"
          @click="selectTask(item)"
        ></TaskCard>
      </template>
    </CardTable>
    <UploadCSVDialog
      :close-dialog-after-data-sent="false"
      :show-preview="true"
      :success-message="csvSuccessMessage"
      :upload-message="`Upload CSV File for ${selectedTask?.name} in ${selectedSemester?.name}`"
      :wait-for-loading="true"
      :loading="loadingApproveStudents"
      preview-name="StudentEmails"
      @submit="handleSubmitCSV"
    />
  </v-container>
</template>
<style scoped>
.no-border {
  border: 2px solid transparent;
}
.thick-border {
  border: 2px solid rgb(var(--v-theme-primary));
}
</style>
