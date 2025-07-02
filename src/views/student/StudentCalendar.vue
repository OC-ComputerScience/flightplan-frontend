<script setup>
import { ref, onMounted } from "vue";
import { defineProps } from "vue";
import Calendar from "../../components/Calendar.vue";
import eventServices from "../../services/eventServices";

const props = defineProps({
  isAdmin: Boolean,
});

const events = ref([]);

const getEvents = async () => {
  try {
    const result = await eventServices.getAllEvents(1, 1000);
    events.value = result.data.events;
  } catch (error) {
    console.error("Error fetching events:", error);
  }
};

onMounted(() => {
  getEvents();
});
</script>

<template>
  <div class="pa-4">
    <h1 class="mt-1">Calendar View</h1>
          <v-row justify="center" class="mr-2">
      <v-col cols="12">
        <v-card color="backgroundDarken" style="border-radius: 25px">
          <v-card-text>
            <v-select
              v-model="selectedFlightPlan"
              :items="flightPlans"
              :item-title="(item) => item.label"
              :item-value="(item) => item.value"
              variant="solo"
              bg-color="background"
              return-object
              class="mb-4"
              density="comfortable"
              flat
              @update:model-value="fetchFlightPlanProgress"
            ></v-select>
            <v-progress-linear
              v-model="progress"
              color="primary"
              bg-color="backgroundLighten"
              height="20"
              style="border-radius: 25px"
            >
              <strong>{{ progress }}%</strong>
            </v-progress-linear>
            <div class="text-center mt-2">
              <span class="text-subtitle-1"
                >Available Points: {{ points }}</span
              >
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <Calendar :events="events" :is-admin="props.isAdmin" />
  </div>
</template>
