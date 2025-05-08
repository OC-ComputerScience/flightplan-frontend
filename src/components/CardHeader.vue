<script setup>
// Props definition
const props = defineProps({
  label: { type: String, default: null },
  addButton: { type: Boolean, default: true },
  filterButton: { type: Boolean, default: true },
  exportCalendarButton: {
    type: Boolean,
    default: false,
  },
});

// Emit event functions
const emit = defineEmits(["changed", "add", "toggle-filters", "export-ics"]);

let timeout = null;

const handleChange = (newValue) => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    emit("changed", newValue);
  }, 200);
};
const handleAdd = () => emit("add");
const handleToggleFilters = () => emit("toggle-filters");
</script>

<template>
  <v-row align="center" class="mt-12" no-gutters>
    <!-- Header -->
    <v-col
      v-if="props.label"
      cols="auto"
      class="d-flex justify-center"
      style="min-width: 100px"
    >
      <h2 class="text-h5">{{ props.label }}</h2>
    </v-col>

    <!-- Search Field -->
    <v-col class="flex-grow-1 mx-4">
      <v-text-field
        label="Search"
        append-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        variant="solo"
        rounded="xl"
        bg-color="backgroundDarken"
        color="text"
        @update:model-value="handleChange"
      ></v-text-field>
    </v-col>

    <!-- Buttons -->
    <v-col cols="auto" class="d-flex justify-end" style="min-width: 50px">
      <!-- Add button -->
      <div v-if="props.addButton">
        <v-btn
          v-if="$vuetify.display.smAndUp"
          rounded="xl"
          class="mr-2"
          color="backgroundDarken"
          @click="handleAdd"
        >
          <v-icon icon="mdi-plus"></v-icon>
        </v-btn>
        <v-btn
          v-else
          icon="mdi-plus"
          color="backgroundDarken"
          class="mr-1"
          @click="handleAdd"
        ></v-btn>
      </div>

      <!-- Export calendar dropdown styled like Filter & Sort -->
      <div v-if="props.exportCalendarButton" class="mr-2">
        <v-btn
          v-bind="menuProps"
          color="backgroundDarken"
          rounded="xl"
          variant="elevated"
          class="export-btn"
          prepend-icon="mdi-calendar-month"
          @click="$emit('export-ics')"
        >
          Export to Calendar
        </v-btn>
      </div>

      <!-- Filter & Sort button (desktop) -->
      <div v-if="props.filterButton">
        <v-btn
          v-if="$vuetify.display.smAndUp"
          color="backgroundDarken"
          rounded="xl"
          @click="handleToggleFilters"
        >
          Filter & Sort
        </v-btn>
        <!-- Filter icon button (mobile) -->
        <v-btn
          v-else
          icon="mdi-filter-variant"
          color="backgroundDarken"
        ></v-btn>
      </div>
    </v-col>
  </v-row>
</template>

<style scoped></style>
