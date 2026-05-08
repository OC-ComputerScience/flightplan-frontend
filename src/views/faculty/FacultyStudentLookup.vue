<script setup>
import { computed, onMounted, ref } from "vue";
import userServices from "../../services/userServices";
import studentServices from "../../services/studentServices";
import flightPlanServices from "../../services/flightPlanServices";
import flightPlanItemServices from "../../services/flightPlanItemServices";
import semesterServices from "../../services/semesterServices";

const email = ref("");
const selectedSemesterId = ref(null);
const semesters = ref([]);

const isLoading = ref(false);
const errorMessage = ref("");

const selectedUser = ref(null);
const selectedStudent = ref(null);
const selectedFlightPlan = ref(null);
const flightPlanItems = ref([]);

const semesterOptions = computed(() =>
  semesters.value.map((semester) => ({
    title: `${semester.term.charAt(0).toUpperCase()}${semester.term.slice(1)} ${semester.year}`,
    value: semester.id,
  })),
);

const selectedSemesterLabel = computed(() => {
  const semester = semesters.value.find(
    (item) => String(item.id) === String(selectedSemesterId.value),
  );
  if (!semester) return "";
  return `${semester.term.charAt(0).toUpperCase()}${semester.term.slice(1)} ${semester.year}`;
});

const resetResults = () => {
  selectedUser.value = null;
  selectedStudent.value = null;
  selectedFlightPlan.value = null;
  flightPlanItems.value = [];
};

const lookupStudentFlightPlan = async () => {
  errorMessage.value = "";
  resetResults();

  if (!email.value || !selectedSemesterId.value) {
    errorMessage.value = "Enter a student email and select a semester.";
    return;
  }

  isLoading.value = true;
  try {
    const userResponse = await userServices.getUserByEmail(email.value.trim());
    const user = userResponse.data;
    if (!user?.id) {
      errorMessage.value = "No user found for that email.";
      return;
    }
    selectedUser.value = user;

    const studentResponse = await studentServices.getStudentForUserId(user.id);
    const student = studentResponse.data;
    if (!student?.id) {
      errorMessage.value = "User found, but no student profile exists.";
      return;
    }
    selectedStudent.value = student;

    const flightPlansResponse = await flightPlanServices.getFlightPlanForStudent(
      student.id,
    );
    const flightPlans = flightPlansResponse.data || [];
    const flightPlan = flightPlans.find(
      (item) => String(item.semester?.id) === String(selectedSemesterId.value),
    );

    if (!flightPlan?.id) {
      errorMessage.value =
        "No flight plan found for this student in the selected semester.";
      return;
    }

    selectedFlightPlan.value = flightPlan;

    const itemsResponse =
      await flightPlanItemServices.getAllFlightPlanItemsForFlightPlan(
        flightPlan.id,
        {
          page: 1,
          pageSize: 1000,
          searchQuery: "",
          filters: {},
        },
      );
    flightPlanItems.value = itemsResponse.data.flightPlanItems || [];
  } catch (error) {
    console.error("Failed to lookup student flight plan:", error);
    errorMessage.value = "Unable to load student flight plan data.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  try {
    const semestersResponse = await semesterServices.getAllSemestersUnfiltered();
    semesters.value = semestersResponse.data || [];
  } catch (error) {
    console.error("Failed to load semesters:", error);
    errorMessage.value = "Could not load semester options.";
  }
});
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h4 mb-4">Student Flight Plan Lookup</h1>

    <v-card color="backgroundDarken" class="pa-4 mb-4">
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="email"
            label="Student Email"
            placeholder="student@oc.edu"
            variant="solo"
            rounded="lg"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedSemesterId"
            :items="semesterOptions"
            item-title="title"
            item-value="value"
            label="Semester"
            variant="solo"
            rounded="lg"
          />
        </v-col>
      </v-row>
      <v-btn color="primary" :loading="isLoading" @click="lookupStudentFlightPlan">
        Search
      </v-btn>

      <v-alert v-if="errorMessage" type="warning" variant="tonal" class="mt-4">
        {{ errorMessage }}
      </v-alert>
    </v-card>

    <v-card
      v-if="selectedUser && selectedStudent && selectedFlightPlan"
      color="backgroundDarken"
      class="pa-4"
    >
      <div class="mb-3">
        <strong>Student:</strong> {{ selectedUser.fName }} {{ selectedUser.lName }}
      </div>
      <div class="mb-3">
        <strong>Semester:</strong> {{ selectedSemesterLabel }}
      </div>

      <v-table density="compact">
        <thead>
          <tr>
            <th>Item</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in flightPlanItems" :key="item.id">
            <td>{{ item.name }}</td>
            <td>{{ item.flightPlanItemType }}</td>
            <td>{{ item.status }}</td>
          </tr>
          <tr v-if="flightPlanItems.length === 0">
            <td colspan="3" class="text-center">No flight plan items found.</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>
