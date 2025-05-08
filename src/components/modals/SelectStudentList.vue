<script setup>
import { ref, defineEmits } from "vue";

// Emit close event to the parent component
const emit = defineEmits(["update:modelValue"]);

// The value that controls the visibility of the modal
const isVisible = ref(false);

// Watch for changes in the `v-model` value and update `isVisible`
const closeModal = () => {
  isVisible.value = false;
  emit("update:modelValue", false); // Emit the updated value to the parent
};
</script>

<template>
  <!-- v-dialog component to display modal -->
  <v-dialog v-model="isVisible" max-width="500px" class="custom-dialog">
    <v-card class="pa-4 rounded-card">
      <v-card-title>
        Add New Student
        <!-- Close Button (X) -->
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
        <!-- Content for adding a student -->
        <p>Content for adding a student can go here.</p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.custom-dialog .v-dialog__content {
  border-radius: 25px;
}

.rounded-card {
  border-radius: 50px; /* Apply border-radius to the card */
}

.float-right {
  margin-left: auto;
}
</style>
