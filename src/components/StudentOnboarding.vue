<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import studentServices from "../services/studentServices";
import strengthServices from "../services/strengthServices";
import majorServices from "../services/majorServices";
import semesterServices from "../services/semesterServices";
import userServices from "../services/userServices";
import flightPlanServices from "../services/flightPlanServices";
import { userStore } from "../stores/userStore";
import { storeToRefs } from "pinia";

const router = useRouter();
const userStoreInstance = userStore();
const { user } = storeToRefs(userStoreInstance);

const selectedGradSemester = ref(null);

const profileDescription = ref("");
const majors = ref([]);
const cliftonStrengths = ref([]);
const errorMessage = ref("");
const isLoading = ref(false);
const majorOptions = ref([]);
const cliftonStrengthsOptions = ref([]);
const semesterOptions = ref([]);

const handleSubmit = async () => {
  try {
    isLoading.value = true;
    const studentData = {
      graduationDate: selectedGradSemester.value.endDate,
      semestersFromGrad:
        semesterOptions.value.indexOf(selectedGradSemester.value) + 1,
      userId: user.value.userId,
      pointsAwarded: 0,
      pointsUsed: 0,
    };

    // Create or get existing student
    const student = await studentServices.createStudent(studentData);

    // Update user profile description
    await userServices.updateUser({
      id: user.value.userId,
      profileDescription: profileDescription.value,
    });

    // Add majors
    majors.value.forEach(async (major) => {
      await studentServices.addMajor(student.data.id, major.id);
    });

    // Add strengths
    cliftonStrengths.value.forEach(async (strength) => {
      await studentServices.addStrength(student.data.id, strength.id);
    });

    // Generate flight plan
    await flightPlanServices.generateFlightPlan(student.data.id);

    router.push("/student"); // Redirect to profile after successful submission
  } catch (error) {
    console.log(error);
    errorMessage.value =
      error.response?.data?.message ||
      "An error occurred while saving student information";
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  try {
    // Fetch majors, strengths, and semesters
    const [majorsResponse, strengthsResponse, semestersResponse] =
      await Promise.all([
        majorServices.getAllMajors(),
        strengthServices.getAllStrengths(),
        semesterServices.getAllSemesters(),
      ]);

    majorOptions.value = majorsResponse.data.majors.map((major) => ({
      title: major.name,
      value: major.id,
      ...major,
    }));

    cliftonStrengthsOptions.value = strengthsResponse.data.map((strength) => ({
      title: strength.name,
      value: strength.id,
      ...strength,
    }));

    // Update semester options mapping
    semesterOptions.value = semestersResponse.data.map((semester) => ({
      ...semester,
      title: `${semester.term.charAt(0).toUpperCase() + semester.term.slice(1)} ${semester.year}`,
      value: semester.number,
    }));
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});
</script>

<template>
  <v-row class="fill-height ma-0" align="center" justify="center">
    <v-card class="pa-4 rounded-card h-100 w-100" color="backgroundDarken">
      <v-col class="fill-height d-flex flex-column">
        <v-card-title class="text-center text-h4 mb-4"> Welcome! </v-card-title>

        <v-card-subtitle class="text-center mb-6">
          Please complete your profile to get started
        </v-card-subtitle>

        <v-card-text class="flex-grow-1 d-flex flex-column">
          <v-form class="d-flex flex-column" @submit.prevent="handleSubmit">
            <v-select
              v-model="selectedGradSemester"
              :items="semesterOptions"
              item-title="title"
              item-value="value"
              label="Expected Graduation Semester"
              class="mb-4"
              return-object
              required
              :rules="[(v) => !!v || 'Please select number of semesters']"
            ></v-select>

            <v-select
              v-model="majors"
              :items="majorOptions"
              item-title="title"
              item-value="value"
              label="Majors"
              multiple
              chips
              class="mb-4"
              return-object
              required
              :rules="[
                (v) => v.length > 0 || 'Please select at least one major',
              ]"
              hint="Select all that apply"
            ></v-select>

            <v-select
              v-model="cliftonStrengths"
              :items="cliftonStrengthsOptions"
              item-title="title"
              item-value="value"
              label="Clifton Strengths (Optional)"
              multiple
              chips
              class="mb-4"
              return-object
              required
              :rules="[
                (v) => v.length <= 5 || 'You can only select up to 5 strengths',
              ]"
              hint="Select all that apply"
            ></v-select>

            <v-text-field
              v-model="profileDescription"
              label="Profile Description"
              type="string"
              class="mb-4"
              required
              :rules="[(v) => v.length > 0 || 'Please enter a description']"
            ></v-text-field>

            <div v-if="errorMessage">
              <v-alert type="error" variant="tonal" class="mb-4">
                {{ errorMessage }}
              </v-alert>
            </div>

            <v-spacer></v-spacer>

            <div class="d-flex justify-center">
              <v-btn
                type="submit"
                color="primary"
                rounded="xl"
                size="large"
                :loading="isLoading"
                :disabled="
                  !selectedGradSemester || majors.length === 0 || isLoading
                "
              >
                Continue
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-col>
    </v-card>
  </v-row>
</template>

<style scoped>
.rounded-card {
  border-radius: 25px;
}
</style>
