<script setup>
import { computed, onMounted, ref, toRaw, watch } from "vue";
import Papa from "papaparse";
import userServices from "../../services/userServices";
import studentServices from "../../services/studentServices";
import flightPlanServices from "../../services/flightPlanServices";
import flightPlanItemServices from "../../services/flightPlanItemServices";
import taskServices from "../../services/taskServices";
import experienceServices from "../../services/experienceServices";
import semesterServices from "../../services/semesterServices";
const semesters = ref([]);
const selectedSemesterId = ref(null);
const selectedTasks = ref([]);
const selectedExperiences = ref([]);

const tasks = ref([]);
const experiences = ref([]);

const csvFile = ref(null);
const uploadedEmails = ref([]);
const reportRows = ref([]);
const usersByEmail = ref({});

const isLoading = ref(false);
const uploadError = ref("");
const reportError = ref("");
const processSummary = ref("");

const asIdList = (value) => {
  if (Array.isArray(value)) {
    return value.filter((id) => id != null && id !== "");
  }
  if (value == null || value === "") return [];
  return [value];
};

const selectedSemester = computed(() =>
  semesters.value.find((semester) => semester.id === selectedSemesterId.value),
);

const semesterOptions = computed(() =>
  semesters.value.map((semester) => ({
    title: `${semester.term.charAt(0).toUpperCase()}${semester.term.slice(1)} ${semester.year}`,
    value: semester.id,
  })),
);

const selectedTaskIds = computed(() =>
  selectedTasks.value.map((item) => item?.id ?? item),
);

const selectedExperienceIds = computed(() =>
  selectedExperiences.value.map((item) => item?.id ?? item),
);

const selectedTaskColumns = computed(() => {
  const selectedIds = new Set(asIdList(selectedTaskIds.value).map((id) => String(id)));
  return (Array.isArray(tasks.value) ? tasks.value : []).filter((task) =>
    selectedIds.has(String(task.id)),
  );
});

const selectedTaskIdSet = computed(
  () => new Set(asIdList(selectedTaskIds.value).map((id) => String(id))),
);

const selectedExperienceColumns = computed(() => {
  const selectedIds = new Set(
    asIdList(selectedExperienceIds.value).map((id) => String(id)),
  );
  return (Array.isArray(experiences.value) ? experiences.value : []).filter(
    (experience) => selectedIds.has(String(experience.id)),
  );
});

const parsedStudentCount = computed(() => uploadedEmails.value.length);
const matchedUserCount = computed(
  () => reportRows.value.filter((row) => row.userId).length,
);
const matchedStudentCount = computed(
  () => reportRows.value.filter((row) => row.studentId).length,
);

const canProcess = computed(() => {
  const hasSemester =
    selectedSemesterId.value !== null && selectedSemesterId.value !== "";
  const hasEmails = uploadedEmails.value.length > 0;
  const hasTasks = selectedTasks.value.length > 0;
  const hasExperiences = selectedExperiences.value.length > 0;
  return hasSemester && hasEmails && (hasTasks || hasExperiences);
});

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
const normalizeEmail = (value) =>
  String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .toLowerCase();
const getTaskIdFromItem = (item) => item?.taskId ?? item?.task?.id ?? null;
const getExperienceIdFromItem = (item) =>
  item?.experienceId ?? item?.experience?.id ?? null;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const ocDomainAlias = (email) => {
  const normalized = normalizeEmail(email);
  if (normalized.endsWith("@eagles.oc.edu")) {
    return `${normalized.slice(0, -"@eagles.oc.edu".length)}@oc.edu`;
  }
  if (normalized.endsWith("@oc.edu")) {
    return `${normalized.slice(0, -"@oc.edu".length)}@eagles.oc.edu`;
  }
  return null;
};

const collectEmailsFromValues = (values) => {
  const emails = [];
  const seen = new Set();

  for (const value of values) {
    const text = String(value ?? "")
      .replace(/^\uFEFF/, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/^mailto:/i, "")
      .trim();
    const matches = text.match(EMAIL_PATTERN) || [];
    for (const match of matches) {
      const email = match.replace(/[>'"]+$/g, "").toLowerCase();
      if (!seen.has(email)) {
        seen.add(email);
        emails.push(email);
      }
    }
  }

  return emails;
};

const extractEmailsFromParsedCsv = (data) => {
  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return [];

  const firstRow = Array.isArray(rows[0])
    ? rows[0]
    : rows[0] && typeof rows[0] === "object"
      ? Object.keys(rows[0])
      : [rows[0]];
  const header = firstRow.map((cell) => String(cell ?? "").trim().toLowerCase());
  const emailColIndex = header.findIndex(
    (col) => col === "email" || col === "e-mail" || col === "email address",
  );

  if (emailColIndex >= 0 && Array.isArray(rows[0])) {
    return collectEmailsFromValues(
      rows.slice(1).map((row) => (Array.isArray(row) ? row[emailColIndex] : "")),
    );
  }

  const cells = [];
  for (const row of rows) {
    if (Array.isArray(row)) cells.push(...row);
    else if (row && typeof row === "object") cells.push(...Object.values(row));
    else cells.push(row);
  }
  return collectEmailsFromValues(cells);
};

const getUploadedFile = (value) => {
  const raw = toRaw(value);
  if (!raw) return null;
  if (raw instanceof File) return raw;
  if (Array.isArray(raw)) {
    const file = raw.find((item) => toRaw(item) instanceof File);
    return file ? toRaw(file) : null;
  }
  if (typeof FileList !== "undefined" && raw instanceof FileList) {
    return raw[0] || null;
  }
  return raw?.target?.files?.[0] || value?.target?.files?.[0] || null;
};

const parseEmailsFromFile = async (file) => {
  const csvText = await file.text();
  const parsed = Papa.parse(csvText, { skipEmptyLines: true });
  const emails = extractEmailsFromParsedCsv(parsed.data);
  if (emails.length > 0) return emails;
  return collectEmailsFromValues([csvText]);
};

const getStudentFromUser = (user) =>
  user?.student || user?.Student || null;

const indexUsersByEmail = (users) => {
  const lookup = {};
  for (const user of users || []) {
    const normalized = normalizeEmail(user?.email);
    if (normalized) {
      lookup[normalized] = user;
    }
  }
  return lookup;
};

const previewRowsFromEmails = (emails) =>
  emails.map((email) => {
    const user = findUserByEmail(email);
    const names = extractUserNames(user);
    const student = getStudentFromUser(user);
    let status = "Not found";
    if (user?.id && student?.id) status = "Student found";
    else if (user?.id) status = "User found, no student profile";
    return {
      studentEmail: user?.email || email,
      firstName: names.firstName,
      lastName: names.lastName,
      userId: user?.id || null,
      studentId: student?.id || null,
      status,
      tasks: {},
      experiences: {},
    };
  });

const loadUsersForEmails = async (emails) => {
  await buildUserLookupMap();
  try {
    const response = await userServices.lookupUsersByEmails(emails);
    const users = Array.isArray(response.data)
      ? response.data
      : response.data?.users || [];
    if (users.length > 0) {
      usersByEmail.value = {
        ...usersByEmail.value,
        ...indexUsersByEmail(users),
      };
    }
  } catch (error) {
    console.warn("Bulk email lookup failed, using full user list:", error);
  }
};

const handleCsvUpload = async (file) => {
  uploadError.value = "";
  processSummary.value = "";
  reportRows.value = [];

  const uploadedFile = getUploadedFile(file);
  if (!uploadedFile) {
    uploadedEmails.value = [];
    return;
  }

  try {
    const parsedEmails = await parseEmailsFromFile(uploadedFile);

    if (parsedEmails.length === 0) {
      uploadError.value =
        "No valid email addresses found in the uploaded CSV file.";
      uploadedEmails.value = [];
      return;
    }

    await loadUsersForEmails(parsedEmails);
    uploadedEmails.value = parsedEmails;
    reportRows.value = previewRowsFromEmails(parsedEmails);
    const matchedUsers = reportRows.value.filter((row) => row.userId).length;
    const matchedStudents = reportRows.value.filter((row) => row.studentId).length;
    processSummary.value = `Found ${parsedEmails.length} email(s) in the file, ${matchedUsers} user(s) and ${matchedStudents} student record(s).`;
  } catch (error) {
    console.error("CSV upload failed:", error);
    uploadError.value =
      error?.message || "Unable to read the uploaded CSV file.";
  }
};

const unwrapList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.experiences)) return data.experiences;
  return [];
};

const fetchReferenceData = async () => {
  const [tasksResponse, experiencesResponse, semestersResponse] = await Promise.all([
    taskServices.getAllActiveTasks(""),
    experienceServices.getAllActiveExperiences(""),
    semesterServices.getAllSemestersUnfiltered(),
  ]);

  tasks.value = unwrapList(tasksResponse.data);
  experiences.value = unwrapList(experiencesResponse.data);
  semesters.value = unwrapList(semestersResponse.data);
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
  const allUsers =
    allUsersResponse.data?.rows ||
    allUsersResponse.data?.users ||
    (Array.isArray(allUsersResponse.data) ? allUsersResponse.data : []);
  usersByEmail.value = indexUsersByEmail(allUsers);
  if (Object.keys(usersByEmail.value).length === 0) {
    throw new Error("User list is empty. Unable to match uploaded emails.");
  }
};

const findUserByEmail = (email) => {
  const normalized = normalizeEmail(email);
  const exactMatch = usersByEmail.value[normalized];
  if (exactMatch?.id) return exactMatch;

  const alias = ocDomainAlias(normalized);
  if (alias) {
    const aliasMatch = usersByEmail.value[alias];
    if (aliasMatch?.id) return aliasMatch;
  }

  return null;
};

const emptyCompletionMaps = () => {
  const tasks = {};
  const experiences = {};
  for (const task of selectedTaskColumns.value) {
    tasks[task.id] = "No";
  }
  for (const experience of selectedExperienceColumns.value) {
    experiences[experience.id] = "No";
  }
  return { tasks, experiences };
};

const buildStudentRow = async (email) => {
  const unmatchedRow = {
    studentEmail: email,
    firstName: "",
    lastName: "",
    userId: null,
    studentId: null,
    status: "Not found",
    ...emptyCompletionMaps(),
  };

  try {
    let user = findUserByEmail(email);
    if (!user?.id) {
      try {
        const userResponse = await userServices.getUserByEmail(email);
        if (userResponse.data?.id) {
          user = userResponse.data;
        } else {
          const alias = ocDomainAlias(email);
          if (alias) {
            const aliasResponse = await userServices.getUserByEmail(alias);
            if (aliasResponse.data?.id) {
              user = aliasResponse.data;
            }
          }
        }
      } catch (error) {
        console.warn(`User email lookup failed for ${email}:`, error);
      }
    }

    const names = extractUserNames(user);
    if (!user?.id) {
      return unmatchedRow;
    }

    const includedStudent = getStudentFromUser(user);
    try {
      let student = includedStudent;
      if (!student?.id) {
        const studentResponse = await studentServices.getStudentForUserId(user.id);
        student = studentResponse.data;
      }

      if (!student?.id) {
        return {
          studentEmail: user.email || email,
          firstName: names.firstName,
          lastName: names.lastName,
          userId: user.id,
          studentId: null,
          status: "User found, no student profile",
          ...emptyCompletionMaps(),
        };
      }

      const flightPlansResponse =
        await flightPlanServices.getFlightPlanForStudent(student.id);
      const flightPlans = flightPlansResponse.data || [];
      const flightPlan = flightPlans.find(
        (plan) =>
          String(plan.semester?.id ?? plan.semesterId) ===
          String(selectedSemesterId.value),
      );

      if (!flightPlan?.id) {
        return {
          studentEmail: user.email || email,
          firstName: names.firstName,
          lastName: names.lastName,
          userId: user.id,
          studentId: student.id,
          status: "No flight plan for semester",
          ...emptyCompletionMaps(),
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
        userId: user.id,
        studentId: student.id,
        status: "Matched",
        tasks: taskCompletionMap,
        experiences: experienceCompletionMap,
      };
    } catch (error) {
      console.warn(`Unable to load completion data for ${email}:`, error);
      return {
        studentEmail: user.email || email,
        firstName: names.firstName,
        lastName: names.lastName,
        userId: user.id,
        studentId: null,
        status: "User found, completion lookup failed",
        ...emptyCompletionMaps(),
      };
    }
  } catch (error) {
    console.warn(`Unable to process student for ${email}:`, error);
    return unmatchedRow;
  }
};

const generateReport = async () => {
  reportError.value = "";
  processSummary.value = "";

  if (!canProcess.value) {
    reportError.value =
      "Upload a CSV and select a semester and at least one task or experience before generating the report.";
    return;
  }

  isLoading.value = true;
  try {
    await loadUsersForEmails(uploadedEmails.value);
    const rows = await Promise.all(uploadedEmails.value.map(buildStudentRow));
    reportRows.value = rows;

    processSummary.value = `Processed ${rows.length} email(s), matched ${rows.filter((row) => row.userId).length} user(s) and ${rows.filter((row) => row.studentId).length} student record(s).`;
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
    "Status",
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
        row.status || "Not found",
      ];
      const taskColumns = selectedTaskColumns.value.map(
        (task) => row.tasks?.[task.id] ?? "",
      );
      const experienceColumns = selectedExperienceColumns.value.map(
        (experience) => row.experiences?.[experience.id] ?? "",
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

watch(csvFile, (file) => {
  handleCsvUpload(toRaw(file));
});

watch([selectedTasks, selectedExperiences, selectedSemesterId], () => {
  reportRows.value = reportRows.value.map((row) => ({
    ...row,
    tasks: {},
    experiences: {},
  }));
});

onMounted(async () => {
  try {
    await fetchReferenceData();
  } catch (error) {
    console.error("Failed to load tasks/semesters:", error);
    reportError.value = "Could not load tasks, experiences, or semesters.";
  }
  try {
    await buildUserLookupMap();
  } catch (error) {
    console.error("Failed to load users:", error);
    reportError.value = "Could not load users for email matching.";
  }
});
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h4 mb-4">Task Completion</h1>

    <v-card class="pa-4 mb-4" color="backgroundDarken">
      <v-row>
        <v-col cols="12" md="6">
          <v-file-input
            v-model="csvFile"
            label="Upload Student Emails CSV"
            accept=".csv,text/csv"
            prepend-icon="mdi-file-delimited"
            show-size
            clearable
          />
          <div class="text-body-2">
            Emails in file: <strong>{{ parsedStudentCount }}</strong>
            <span class="ml-4">
              Matched users: <strong>{{ matchedUserCount }}</strong>
            </span>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            Use an Email column, or a list of addresses. Matching is case-insensitive.
            <code>@eagles.oc.edu</code> and <code>@oc.edu</code> are treated as the same person when only one exists.
          </div>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedSemesterId"
            :items="semesterOptions"
            item-title="title"
            item-value="value"
            label="Select Semester"
          />
          <v-select
            v-model="selectedTasks"
            :items="tasks"
            item-title="name"
            item-value="id"
            return-object
            label="Select Task(s)"
            multiple
            chips
            clearable
          />
          <v-select
            v-model="selectedExperiences"
            :items="experiences"
            item-title="name"
            item-value="id"
            return-object
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
        Matched users: <strong>{{ matchedUserCount }}</strong>
        <span class="ml-4">
          Matched student records: <strong>{{ matchedStudentCount }}</strong>
        </span>
      </div>
      <v-table density="compact">
        <thead>
          <tr>
            <th>Student Email</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Status</th>
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
          <tr
            v-for="(row, index) in reportRows"
            :key="`${index}-${row.studentEmail}`"
          >
            <td>{{ row.studentEmail }}</td>
            <td>{{ row.firstName }}</td>
            <td>{{ row.lastName }}</td>
            <td>{{ row.status || "Not found" }}</td>
            <td v-for="task in selectedTaskColumns" :key="`${index}-${task.id}`">
              {{ row.tasks?.[task.id] ?? "" }}
            </td>
            <td
              v-for="experience in selectedExperienceColumns"
              :key="`${index}-exp-${experience.id}`"
            >
              {{ row.experiences?.[experience.id] ?? "" }}
            </td>
          </tr>
          <tr v-if="reportRows.length === 0">
            <td :colspan="4 + selectedTaskColumns.length + selectedExperienceColumns.length" class="text-center">
              Upload CSV to preview matched users, then generate a report.
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>
