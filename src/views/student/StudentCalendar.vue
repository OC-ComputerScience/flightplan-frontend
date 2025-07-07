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
    <v-row justify="center" class="mr-2">
      <v-col cols="12">
        <v-card color="backgroundDarken" style="border-radius: 25px">
          <div style="padding: 5px;">
          <h1 class="mt-1" style="margin-left: 10px;">Calendar View</h1>
          <p class="section-headers" style="font-size: 16px; margin-left: 10px">
            View upcoming events and register for them here. You can view details for the event on the right panel for your selected date. Click one the first date and shift+click on another date to select a range of dates. Press ctrl+click on several dates to specifically select a group of days. 
          </p>
          </div>
        </v-card>
      </v-col>
    </v-row>
    <Calendar :events="events" :is-admin="props.isAdmin" />
  </div>
</template>

<style scoped>
.section-headers {
  font-size: 24px;
  margin-left: 10px;
  margin-right: 10px;
}
</style>
