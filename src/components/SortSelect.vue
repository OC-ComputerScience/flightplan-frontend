<script setup>
import { ref, defineProps, defineEmits, onMounted } from "vue";

const props = defineProps({
  sortOptions: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);
const selectedSort = ref(null);
const sortDirection = ref("asc");

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  emitSort();
};

const emitSort = () => {
  emit("update:modelValue", {
    sortAttribute: selectedSort.value,
    sortDirection: sortDirection.value,
  });
};

onMounted(() => {
  selectedSort.value = props.modelValue.sortAttribute;
  sortDirection.value = props.modelValue.sortDirection;
});
</script>

<template>
  <v-row align="center" justify="start" class="pa-3">
    <v-select
      v-model="selectedSort"
      :items="sortOptions"
      label="Sort by"
      hide-details
      @update:model-value="emitSort"
    ></v-select>
    <v-icon class="ml-4" @click="toggleSortDirection">{{
      sortDirection === "asc" ? "mdi-arrow-up" : "mdi-arrow-down"
    }}</v-icon>
  </v-row>
</template>
