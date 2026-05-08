<script setup>
import { computed, onMounted, ref } from "vue";
import userServices from "../../services/userServices";
import studentServices from "../../services/studentServices";
import flightPlanServices from "../../services/flightPlanServices";
import flightPlanItemServices from "../../services/flightPlanItemServices";
import taskServices from "../../services/taskServices";
import experienceServices from "../../services/experienceServices";
import semesterServices from "../../services/semesterServices";
const semesters = ref([]);
const selectedSemesterId = ref(null);
const selectedTaskIds = ref([]);
const selectedExperienceIds = ref([]);

const tasks = ref([]);
const experiences = ref([]);

const uploadedEmails = ref([]);
const reportRows = ref([]);
const usersByEmail = ref(new Map());

const isLoading = ref(false);
const uploadError = ref("");
const reportError = ref("");
const processSummary = ref("");

const selectedSemester = computed(() =>
  semesters.value.find((semester) => semester.id === selectedSemesterId.value),
);

const semesterOptions = computed(() =>
  semesters.value.map((semester) => ({
    label: `${semester.term.charAt(0).toUpperCase()}${semester.term.slice(1)} ${semester.year}`,
    value: semester.id,
  })),
);

const selectedTaskColumns = computed(() => {
  const selectedIds = new Set(selectedTaskIds.value.map((id) => String(id)));
  return tasks.value.filter((task) => selectedIds.has(String(task.id)));
});

const selectedTaskIdSet = computed(
  () => new Set(selectedTaskIds.value.map((id) => String(id))),
);

const selectedExperienceColumns = computed(() =>
  experiences.value.filter((experience) => {
    const selectedIds = new Set(
      selectedExperienceIds.value.map((id) => String(id)),
    );
    return selectedIds.has(String(experience.id));
  }),
);

const parsedStudentCount = computed(() => uploadedEmails.value.length);
const matchedStudentCount = computed(
  () => reportRows.value.filter((row) => row.studentId).length,
);

const canProcess = computed(
  () =>
    selectedSemesterId.value !== null &&
    selectedTaskIds.value.length > 0 &&
    uploadedEmails.value.length > 0,
);

const canExport = computed(() => reportRows.value.length > 0);

const csvEscape = (value) => {
  const safeValue = value == null ? "" : String(value);
  if (safeValue.includes(",") || safeValue.includes('"') || safeValue.includes("\n")) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
};

const isComplete = (status) =>
  String(status || "").trim().toLowerCase() === "complete";
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const getTaskIdFromItem = (item) => item?.taskId ?? item?.task?.id ?? null;
const getExperienceIdFromItem = (item) =>
  item?.experienceId ?? item?.experience?.id ?? null;

const parseEmailsFromCsv = (csvText) => {
  const tokens = csvText
    .replace(/\r/g, "\n")
    .split(/[\n,;\t]/g)
    .map((token) => token.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const uniqueEmails = [...new Set(tokens.map((token) => token.toLowerCase()))];
  return uniqueEmails.filter((email) => emailRegex.test(email));
};

const handleCsvUpload = async (file) => {
  uploadError.value = "";
  processSummary.value = "";
  reportRows.value = [];

  if (!file) {
    uploadedEmails.value = [];
    return;
  }

  try {
    const csvText = await file.text();
    const parsedEmails = parseEmailsFromCsv(csvText);

    if (parsedEmails.length === 0) {
      uploadError.value =
        "No valid email addresses found in the uploaded CSV file.";
      uploadedEmails.value = [];
      return;
    }

    uploadedEmails.value = parsedEmails;
  } catch (error) {
    console.error("CSV upload failed:", error);
    uploadError.value = "Unable to read the uploaded CSV file.";
  }
};

const fetchReferenceData = async () => {
  const [tasksResponse, experiencesResponse, semestersResponse] = await Promise.all([
    taskServices.getAllActiveTasks(""),
    experienceServices.getAllActiveExperiences(""),
    semesterServices.getAllSemestersUnfiltered(),
  ]);

  tasks.value = tasksResponse.data || [];
  experiences.value = experiencesResponse.data || [];
  semesters.value = semestersResponse.data || [];
};

const getFlightPlanItems = async (flightPlanId) => {
  const response = await flightPlanItemServices.getAllFlightPlanItemsForFlightPlan(
    flightPlanId,
    {
      page: 1,
      pageSize: 5000,
      searchQuery: "",
      filters: {},
    },
  );
  return response.data.flightPlanItems || [];
};

const extractUserNames = (user) => {
  const firstName =
    user?.fName ||
    user?.fname ||
    user?.firstName ||
    user?.first_name ||
    "";
  const lastName =
    user?.lName ||
    user?.lname ||
    user?.lastName ||
    user?.last_name ||
    "";

  if (firstName || lastName) {
    return { firstName, lastName };
  }

  const fullName = (user?.fullName || user?.fullname || "").trim();
  if (!fullName) {
    return { firstName: "", lastName: "" };
  }

  const parts = fullName.split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

const buildUserLookupMap = async () => {
  const allUsersResponse = await userServices.getAllUser();
  const allUsers = allUsersResponse.data?.rows || [];
  const lookup = new Map();
  for (const user of allUsers) {
    const normalized = normalizeEmail(user?.email);
    if (normalized) {
      lookup.set(normalized, user);
    }
  }
  usersByEmail.value = lookup;
};

const buildStudentRow = async (email) => {
  try {
    const userResponse = await userServices.getUserByEmail(email);
    let user = userResponse.data;
    if (!user?.id) {
      user = usersByEmail.value.get(normalizeEmail(email)) || user;
    }
    const names = extractUserNames(user);

    if (!user?.id) {
      return {
        studentEmail: email,
        firstName: "",
        lastName: "",
        studentId: null,
        tasks: {},
        experiences: {},
      };
    }

    const studentResponse = await studentServices.getStudentForUserId(user.id);
    const student = studentResponse.data;

    if (!student?.id) {
      return {
        studentEmail: user.email || email,
        firstName: names.firstName,
        lastName: names.lastName,
        studentId: null,
        tasks: {},
        experiences: {},
      };
    }

    const flightPlansResponse = await flightPlanServices.getFlightPlanForStudent(
      student.id,
    );
    const flightPlans = flightPlansResponse.data || [];
    const flightPlan = flightPlans.find(
      (plan) => String(plan.semester?.id) === String(selectedSemesterId.value),
    );

    if (!flightPlan?.id) {
      return {
        studentEmail: user.email || email,
        firstName: names.firstName,
        lastName: names.lastName,
        studentId: student.id,
        tasks: {},
        experiences: {},
      };
    }

    const flightPlanItems = await getFlightPlanItems(flightPlan.id);

    const completedTaskIds = new Set(
      flightPlanItems
        .filter(
          (item) =>
            getTaskIdFromItem(item) != null &&
            selectedTaskIdSet.value.has(String(getTaskIdFromItem(item))) &&
            isComplete(item.status),
        )
        .map((item) => String(getTaskIdFromItem(item))),
    );

    const completedExperienceIds = new Set(
      flightPlanItems
        .filter(
          (item) =>
            getExperienceIdFromItem(item) != null &&
            isComplete(item.status),
        )
        .map((item) => String(getExperienceIdFromItem(item))),
    );

    const taskCompletionMap = {};
    for (const task of selectedTaskColumns.value) {
      taskCompletionMap[task.id] = completedTaskIds.has(String(task.id))
        ? "Yes"
        : "No";
    }

    const experienceCompletionMap = {};
    for (const experience of selectedExperienceColumns.value) {
      experienceCompletionMap[experience.id] = completedExperienceIds.has(
        String(experience.id),
      )
        ? "Yes"
        : "No";
    }

    return {
      studentEmail: user.email || email,
      firstName: names.firstName,
      lastName: names.lastName,
      studentId: student.id,
      tasks: taskCompletionMap,
      experiences: experienceCompletionMap,
    };
  } catch (error) {
    console.warn(`Unable to process student for ${email}:`, error);
    return {
      studentEmail: email,
      firstName: "",
      lastName: "",
      studentId: null,
      tasks: {},
      experiences: {},
    };
  }
};

const generateReport = async () => {
  reportError.value = "";
  processSummary.value = "";

  if (!canProcess.value) {
    reportError.value =
      "Upload a CSV and select semester and at least one task before generating the report.";
    return;
  }

  isLoading.value = true;
  try {
    await buildUserLookupMap();
    const rows = await Promise.all(uploadedEmails.value.map(buildStudentRow));
    reportRows.value = rows;

    processSummary.value = `Processed ${rows.length} email(s), matched ${rows.filter((row) => row.studentId).length} student record(s).`;
  } catch (error) {
    console.error("Report generation failed:", error);
    reportError.value = "Failed to generate report data.";
  } finally {
    isLoading.value = false;
  }
};

const exportReportCsv = () => {
  if (!canExport.value) return;

  const headers = [
    "Student Email",
    "First Name",
    "Last Name",
    ...selectedTaskColumns.value.map((task) => `Task: ${task.name}`),
    ...selectedExperienceColumns.value.map(
      (experience) => `Experience: ${experience.name}`,
    ),
  ];

  const lines = [
    headers.map(csvEscape).join(","),
    ...reportRows.value.map((row) => {
      const baseColumns = [
        row.studentEmail,
        row.firstName,
        row.lastName,
      ];
      const taskColumns = selectedTaskColumns.value.map(
        (task) => row.tasks[task.id] || "No",
      );
      const experienceColumns = selectedExperienceColumns.value.map(
        (experience) => row.experiences[experience.id] || "No",
      );
      return [...baseColumns, ...taskColumns, ...experienceColumns]
        .map(csvEscape)
        .join(",");
    }),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "faculty-task-completion-report.csv";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
};

onMounted(async () => {
  await fetchReferenceData();
});
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h4 mb-4">Task Completion</h1>

    <v-card class="pa-4 mb-4" color="backgroundDarken">
      <v-row>
        <v-col cols="12" md="6">
          <v-file-input
            label="Upload Student Emails CSV"
            accept=".csv,text/csv"
            prepend-icon="mdi-file-delimited"
            show-size
            @update:model-value="handleCsvUpload"
          />
          <div class="text-body-2">
            Students in file: <strong>{{ parsedStudentCount }}</strong>
          </div>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedSemesterId"
            :items="semesterOptions"
            item-title="label"
            item-value="value"
            label="Select Semester"
          />
          <v-select
            v-model="selectedTaskIds"
            :items="tasks"
            item-title="name"
            item-value="id"
            label="Select Task(s)"
            multiple
            chips
            clearable
          />
          <v-select
            v-model="selectedExperienceIds"
            :items="experiences"
            item-title="name"
            item-value="id"
            label="Select Experience(s)"
            multiple
            chips
            clearable
          />
        </v-col>
      </v-row>

      <v-alert
        v-if="uploadError"
        type="warning"
        variant="tonal"
        class="mt-3"
      >
        {{ uploadError }}
      </v-alert>
      <v-alert
        v-if="reportError"
        type="error"
        variant="tonal"
        class="mt-3"
      >
        {{ reportError }}
      </v-alert>
      <v-alert
        v-if="processSummary"
        type="success"
        variant="tonal"
        class="mt-3"
      >
        {{ processSummary }}
      </v-alert>

      <div class="mt-4 d-flex ga-2">
        <v-btn
          color="primary"
          :loading="isLoading"
          :disabled="!canProcess"
          @click="generateReport"
        >
          Generate Completion Report
        </v-btn>
        <v-btn
          color="secondary"
          :disabled="!canExport"
          @click="exportReportCsv"
        >
          Export CSV
        </v-btn>
      </div>
    </v-card>

    <v-card class="pa-4" color="backgroundDarken">
      <div class="text-body-1 mb-2">
        Matched student records: <strong>{{ matchedStudentCount }}</strong>
      </div>
      <v-table density="compact">
        <thead>
          <tr>
            <th>Student Email</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th v-for="task in selectedTaskColumns" :key="task.id">
              {{ task.name }}
            </th>
            <th
              v-for="experience in selectedExperienceColumns"
              :key="experience.id"
            >
              {{ experience.name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in reportRows" :key="row.studentEmail">
            <td>{{ row.studentEmail }}</td>
            <td>{{ row.firstName }}</td>
            <td>{{ row.lastName }}</td>
            <td v-for="task in selectedTaskColumns" :key="`${row.studentEmail}-${task.id}`">
              {{ row.tasks[task.id] || "No" }}
            </td>
            <td
              v-for="experience in selectedExperienceColumns"
              :key="`${row.studentEmail}-${experience.id}`"
            >
              {{ row.experiences[experience.id] || "No" }}
            </td>
          </tr>
          <tr v-if="reportRows.length === 0">
            <td :colspan="3 + selectedTaskColumns.length + selectedExperienceColumns.length" class="text-center">
              Upload CSV and generate a report to view results.
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>
