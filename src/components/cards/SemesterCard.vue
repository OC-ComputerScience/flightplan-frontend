<script setup>
import { computed } from "vue";

const props = defineProps({
  semester: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["edit", "delete"]);

const termLabel = computed(() => {
  const term = props.semester.term || "";
  return term.charAt(0).toUpperCase() + term.slice(1);
});

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const isCurrent = computed(() => {
  const start = new Date(props.semester.startDate);
  const end = new Date(props.semester.endDate);
  const now = new Date();
  return start <= now && now <= end;
});
</script>

<template>
  <v-card
    color="backgroundDarken"
    class="h-100 cardContainer d-flex flex-column"
  >
    <v-card-text class="flex-grow-1">
      <div class="d-flex align-center mb-2">
        <p class="text-h5 mb-0">
          {{ termLabel }} {{ props.semester.year }}
        </p>
        <v-chip
          v-if="isCurrent"
          class="ml-2"
          color="primary"
          size="small"
          variant="flat"
        >
          Current
        </v-chip>
      </div>
      <p class="text-body-1">
        {{ formatDate(props.semester.startDate) }} –
        {{ formatDate(props.semester.endDate) }}
      </p>
    </v-card-text>
    <v-card-subtitle class="mt-auto">
      <div class="ma-2 float-end">
        <v-btn
          color="warning"
          class="mr-2 cardButton"
          @click="emit('edit', props.semester.id)"
        >
          <v-icon icon="mdi-pencil" color="text" size="x-large"></v-icon>
        </v-btn>
        <v-btn
          color="danger"
          class="cardButton"
          @click="emit('delete', props.semester.id)"
        >
          <v-icon icon="mdi-delete" color="text" size="x-large"></v-icon>
        </v-btn>
      </div>
    </v-card-subtitle>
  </v-card>
</template>

<style scoped>
.cardContainer {
  min-width: 280px;
  border-radius: 25px;
}
.cardButton {
  border-radius: 13px;
}
</style>
