<script setup>
import { ref, onMounted } from "vue";
import Calendar from "../../components/Calendar.vue";
import eventServices from "../../services/eventServices";

const props = defineProps({
  isAdmin: Boolean,
});

const events = ref([]);
const dotAttributes = ref([]);

// Optional: Add dot attributes if Calendar uses them
const formatEventsForDots = (eventList) => {
  return [
    {
      dates: eventList.map((e) => new Date(e.date)),
      popover: {
        label: "Scheduled Event",
      },
    },
  ];
};

const getEvents = async () => {
  try {
    const result = await eventServices.getAllEvents(1, 1000);
    events.value = result.data.events;
    dotAttributes.value = formatEventsForDots(events.value);
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
    <h1 class="text-h4">Calendar View</h1>
    <Calendar :events="events" :is-admin="props.isAdmin" />
  </div>
</template>
