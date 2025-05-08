<script setup>
import { ref, computed, watch } from "vue";
import dayjs from "dayjs"; // Importing day.js

const props = defineProps({
  label: {
    type: String,
    default: "Select Date",
  },
  modelValue: { type: [String, Date], default: null },
});

const emit = defineEmits(["update:modelValue"]);

const menu = ref(false);
const selectedDate = ref(
  props.modelValue ? dayjs(props.modelValue).toDate() : null,
);

// Watch for changes in the prop modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    selectedDate.value = newValue ? dayjs(newValue).toDate() : null;
  },
);

// Emit updated value when selectedDate changes
watch(selectedDate, (newValue) => {
  emit("update:modelValue", newValue ? dayjs(newValue).toISOString() : null);
});

const fieldLabel = ref(props.label);

// Format the date for display using day.js
const formattedDate = computed(() =>
  selectedDate.value ? dayjs(selectedDate.value).format("MMM D, YYYY") : "",
);

// Clear the date selection
const clearDate = () => {
  selectedDate.value = null;
  emit("update:modelValue", null);
};
</script>

<template>
  <v-menu
    v-model="menu"
    transition="scale-transition"
    offset-y
    :close-on-content-click="false"
  >
    <!-- eslint-disable-next-line -->
    <template #activator="{ props }">
      <v-text-field
        v-model="formattedDate"
        variant="solo"
        v-bind="props"
        :label="fieldLabel"
        prepend-inner-icon="mdi-calendar"
        readonly
        clearable
        @click:clear="clearDate"
      />
    </template>
    <v-date-picker v-model="selectedDate" @update:model-value="menu = false">
      <template #actions>
        <v-btn text="OK" @click="menu = false"></v-btn>
      </template>
    </v-date-picker>
  </v-menu>
</template>
