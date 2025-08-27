<script setup>
import { ref, computed, watch } from "vue";
import dayjs from "dayjs"; // Importing day.js

const props = defineProps({
  label: {
    type: String,
    default: "Select Date",
  },
  modelValue: {
    type: [String, Date],
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "update:disabled"]);
const menu = ref(false);
const selectedDate = ref(
  props.modelValue ? dayjs(props.modelValue).toDate() : null,
);

// console.log("Should this be disabled?: ", props.disabled);

// Watch for changes in the prop modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    selectedDate.value = newValue ? dayjs(newValue).toDate() : null;
  },
);

// Add this watch to ensure the disabled state is reactive
watch(
  () => props.disabled,
  (newDisabled) => {
    console.log("Received disabled prop:", newDisabled);
    menu.value = !newDisabled;
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
    :disabled="props.disabled"
    transition="scale-transition"
    offset-y
    :close-on-content-click="false"
  >
    <template #activator="{ props }">
      <v-text-field
        v-model="formattedDate"
        :disabled="props.disabled"
        variant="solo"
        v-bind="props"
        :label="fieldLabel"
        prepend-inner-icon="mdi-calendar"
        readonly
        :clearable="!props.disabled"
        @click:clear="clearDate"
      ></v-text-field>
    </template>
    <v-date-picker
      v-model="selectedDate"
      :disabled="props.disabled"
      @update:model-value="menu = false"
    >
      <template #actions>
        <v-btn text="OK" @click="menu = false"></v-btn>
      </template>
    </v-date-picker>
  </v-menu>
</template>
