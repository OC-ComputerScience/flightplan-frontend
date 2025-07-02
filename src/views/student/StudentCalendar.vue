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
        
        </v-card>
      </v-col>
    </v-row>
    <Calendar :events="events" :is-admin="props.isAdmin" />
  </div>
</template>
