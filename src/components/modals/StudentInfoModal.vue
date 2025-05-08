<script setup>
import { ref, defineEmits } from "vue";
import studentServices from "../../services/studentServices";

const emit = defineEmits(["update:modelValue", "submitted"]);

const isVisible = ref(false);
const graduationDate = ref("");
const semestersFromGrad = ref(0);
const errorMessage = ref("");
const successMessage = ref("");

const closeModal = () => {
  isVisible.value = false;
  emit("update:modelValue", false);
};

const handleSubmit = async () => {
  try {
    const studentData = {
      graduationDate: graduationDate.value,
      semestersFromGrad: semestersFromGrad.value,
      pointsAwarded: 0,
      pointsUsed: 0,
    };

    await studentServices.createStudent(studentData);
    successMessage.value = "Student information saved successfully!";

    setTimeout(() => {
      successMessage.value = "";
      closeModal();
      emit("submitted");
    }, 2000);
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      "An error occurred while saving student information";
  }
};
</script>

<template>
  <v-dialog v-model="isVisible" max-width="500px" class="custom-dialog">
    <v-card class="pa-4 rounded-card">
      <v-card-title class="text-center text-h4">
        Student Information
        <v-btn
          class="mr-2 float-right"
          variant="outlined"
          rounded="xl"
          @click="closeModal"
        >
          Cancel
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-fade-transition mode="out-in">
          <div v-if="successMessage">
            <v-alert type="success" variant="tonal">{{
              successMessage
            }}</v-alert>
          </div>
          <div v-else>
            <v-form @submit.prevent="handleSubmit">
              <v-text-field
                v-model="graduationDate"
                label="Expected Graduation Date"
                type="date"
                variant="outlined"
                rounded="xl"
                class="mb-4"
                required
              ></v-text-field>

              <v-text-field
                v-model="semestersFromGrad"
                label="Semesters Until Graduation"
                type="number"
                variant="outlined"
                rounded="xl"
                class="mb-4"
                required
              ></v-text-field>

              <div v-if="errorMessage">
                <v-alert type="error" variant="tonal">{{
                  errorMessage
                }}</v-alert>
              </div>

              <div class="d-flex justify-center mt-4">
                <v-btn
                  type="submit"
                  color="primary"
                  rounded="xl"
                  :disabled="!graduationDate || !semestersFromGrad"
                >
                  Submit
                </v-btn>
              </div>
            </v-form>
          </div>
        </v-fade-transition>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.custom-dialog .v-dialog__content {
  border-radius: 25px;
}

.rounded-card {
  border-radius: 50px;
}

.float-right {
  margin-left: auto;
}
</style>
