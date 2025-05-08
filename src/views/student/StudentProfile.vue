<script setup>
import { onMounted, ref } from "vue";
import studentServices from "../../services/studentServices";
import { userStore } from "../../stores/userStore";
import { storeToRefs } from "pinia";

const userStoreInstance = userStore();
const { user } = storeToRefs(userStoreInstance);
const student = ref(null);

const checkStudentInfo = async () => {
  try {
    const response = await studentServices.getStudentForUserId(
      user.value.userId,
    );
    student.value = response.data;
  } catch (error) {
    console.error("Error fetching student info:", error);
  }
};

onMounted(() => {
  checkStudentInfo();
});
</script>

<template>
  <v-container>
    <h1>Student Profile</h1>
    <v-card v-if="student" class="mt-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <h3>Student Information</h3>
            <p><strong>Name:</strong> {{ user?.fName }} {{ user?.lName }}</p>
            <p><strong>Student ID:</strong> {{ user?.studentId }}</p>
            <p>
              <strong>Graduation Date:</strong>
              {{
                student?.graduationDate
                  ? new Date(student.graduationDate).toLocaleDateString()
                  : "Not set"
              }}
            </p>
            <p>
              <strong>Semesters Until Graduation:</strong>
              {{ student?.semestersFromGrad || "Not set" }}
            </p>
            <p>
              <strong>Points Awarded:</strong> {{ student?.pointsAwarded || 0 }}
            </p>
            <p><strong>Points Used:</strong> {{ student?.pointsUsed || 0 }}</p>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>
