<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Are you sure?",
  },
  confirmText: {
    type: String,
    default: "Confirm",
  },
  cancelText: {
    type: String,
    default: "Cancel",
  },
  confirmColor: {
    type: String,
    default: "success",
  },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const cancel = () => {
  emit("update:modelValue", false); // Close the dialog
};

const confirm = () => {
  emit("confirm"); // Emit the confirm event
  emit("update:modelValue", false); // Close the dialog
};
</script>
<template>
  <v-dialog v-model="internalValue" width="300px">
    <v-card color="backgroundDarken" class="rounded-lg">
      <v-card-text>
        <div style="text-align: center">
          <h3>{{ title }}</h3>
        </div>
        <div class="mt-5" style="display: flex; justify-content: center">
          <v-btn class="mr-2" variant="outlined" rounded="xl" @click="cancel">
            {{ cancelText }}
          </v-btn>
          <v-btn rounded="xl" :color="confirmColor" @click="confirm">
            {{ confirmText }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.mt-5 {
  margin-top: 20px;
}
</style>
