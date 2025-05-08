<script setup>
// Vue Imports
import { computed } from "vue";

// Props
const props = defineProps({
  flightPlanItem: {
    type: Object,
    required: true,
  },
});

// Emits
const emit = defineEmits(["approve"]);

// Computed Properties
const color = computed(
  () =>
    ({
      Incomplete: "danger",
      Pending: "warning",
      Registered: "warning",
    })[props.flightPlanItem.status] || "primary",
);

const points = computed(
  () =>
    ({
      Task: props.flightPlanItem.task?.points,
      Experience: props.flightPlanItem.experience?.points,
    })[props.flightPlanItem.flightPlanItemType],
);

const showPoints = computed(
  () =>
    props.flightPlanItem.status === "Complete" ||
    props.flightPlanItem.status === "Registered",
);
</script>

<template>
  <v-card color="backgroundDarken" class="rounded-xl pa-0 ma-0">
    <v-container class="pa-2">
      <v-row no-gutters>
        <!-- Status Indicator -->
        <v-col cols="1">
          <v-sheet :color="color" class="accentChip mr-2 h-100" />
        </v-col>

        <!-- Content -->
        <v-col cols="11">
          <v-card-text class="text-no-wrap">
            <!-- Name with Tooltip -->
            <v-tooltip bottom>
              <template #activator="{ props: tooltipProps }">
                <p v-bind="tooltipProps" class="text-h6 mb-2 truncate-text">
                  {{ flightPlanItem.name }}
                </p>
              </template>
              <span>{{ flightPlanItem.name }}</span>
            </v-tooltip>

            <!-- Item Details -->
            <p>{{ flightPlanItem.flightPlanItemType }}</p>
            <p>{{ flightPlanItem.status }}</p>
            <p :class="{ 'mb-5': showPoints }">Points: {{ points }}</p>
          </v-card-text>

          <!-- Action Button -->
          <v-row justify="end">
            <v-btn
              class="mr-4 mb-3"
              rounded="xl"
              variant="outlined"
              @click="emit('approve', props.flightPlanItem)"
            >
              View Submission
              <v-icon right class="pl-1">mdi-eye</v-icon>
            </v-btn>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<style scoped>
.cardContainer {
  border-radius: 25px;
}

.accentChip {
  border-radius: 20px 0px 0px 20px;
}

.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
  display: block;
}
</style>
