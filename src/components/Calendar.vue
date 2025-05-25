<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import EventCard from "./cards/EventCard.vue";
import EventDialog from "./dialogs/EventDialog.vue";
import { useRouter } from "vue-router";
import eventServices from "../services/eventServices";
import studentServices from "../services/studentServices";
import { userStore } from "../stores/userStore";
import { getEventCardColor } from "../utils/eventStatus";

const store = userStore();
const studentId = ref(null);

const router = useRouter();
const props = defineProps({
  events: {
    type: Array,
    default: () => [],
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const dialogVisible = ref(false);
const selectedEvent = ref(null);
const registeredEvents = ref([]);
const checkedInEvents = ref([]);
const allEvents = ref([]); // Local ref for all events

const getEvents = async () => {
  try {
    const result = await eventServices.getAllEvents(1, 1000);
    allEvents.value = result.data.events;
  } catch (error) {
    console.error("Failed to refresh events:", error);
  }
};

const openDialog = (event) => {
  selectedEvent.value = event;
  dialogVisible.value = true;
};

const handleEdit = (eventId) =>
  router.push({ name: "editEvent", params: { id: eventId } });

const handleAdd = () => {
  router.push({
    name: "addEvent",
    params: {
      date: selectedDates.value[0].toISOString(),
    },
  });
};

const handleCancel = (eventId) => {
  console.log("Canceling event:", eventId);
}


const handleRecordAttendance = (event) => {
  router.push({
    name: "attendanceEvent",
    params: { id: event.id, eventName: event.name },
  });
};

const handleGenerateQRCode = (event) => {
  console.log("Generating QR for:", event.name);
};

const handleRegister = async (event) => {
  if (!studentId.value) return;
  try {
    await eventServices.registerStudents(event.id, [studentId.value]);
    await fetchStudentStatus();
    const updatedEvent = await eventServices.getEvent(event.id);
    selectedEvent.value = updatedEvent.data; // <-- Force refresh of event
  } catch (err) {
    console.error("Registration error:", err);
  }
};

const handleUnregister = async (event) => {
  if (!studentId.value) return;
  try {
    await eventServices.unregisterStudents(event.id, [studentId.value]);
    await fetchStudentStatus();
    const updatedEvent = await eventServices.getEvent(event.id);
    selectedEvent.value = updatedEvent.data; // <-- Force refresh of event
  } catch (err) {
    console.error("Unregistration error:", err);
  }
};

const fetchStudentId = async () => {
  try {
    const userId = store.user?.userId;
    if (!userId) return;
    const res = await studentServices.getStudentForUserId(userId);
    studentId.value = res.data.id;
  } catch (err) {
    console.error("Failed to fetch student ID:", err);
  }
};

const fetchStudentStatus = async () => {
  if (!studentId.value) return;
  try {
    const [registeredRes, checkedInRes] = await Promise.all([
      eventServices.getRegisteredEventsForStudent(studentId.value),
      eventServices.getAttendingEventsForStudent(studentId.value),
    ]);
    registeredEvents.value = registeredRes.data;
    checkedInEvents.value = checkedInRes.data;
  } catch (err) {
    console.error("Error fetching student status:", err);
  }
};

const today = new Date();
const selectedDates = ref([today]);
const lastSelectedDate = ref(null);

const interactiveAttribute = ref({
  highlight: "primary",
  dates: selectedDates.value,
});

const eventDots = ref([]);
const attributes = ref([]);

const eventsGroupedByDate = computed(() => {
  if (!allEvents.value || selectedDates.value.length === 0) return {};

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const grouped = {};
  [...selectedDates.value]
    .sort((a, b) => a - b)
    .forEach((selectedDate) => {
      const dateStr = formatDate(selectedDate);
      grouped[dateStr] = allEvents.value
        .filter((event) => formatDate(event.date) === dateStr)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    });

  return grouped;
});

const filteredEventsGroupedByDate = computed(() => {
  if (selectedDates.value.length === 1) return eventsGroupedByDate.value;
  const filtered = {};
  for (const [date, eventList] of Object.entries(eventsGroupedByDate.value)) {
    if (eventList.length > 0) {
      filtered[date] = eventList;
    }
  }
  return filtered;
});

function groupByStartTime(events) {
  const map = {};
  events.forEach((event) => {
    const label = new Date(event.startTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (!map[label]) map[label] = [];
    map[label].push(event);
  });
  return map;
}

const updateAttributes = () => {
  interactiveAttribute.value.dates = [...selectedDates.value];
  attributes.value = [];
  if (interactiveAttribute.value.dates.length > 0) {
    attributes.value.push({ ...interactiveAttribute.value });
  }
  if (eventDots.value.length > 0) {
    attributes.value.push(...eventDots.value);
  }
};

const generateEventDots = (eventList) => {
  if (!Array.isArray(eventList) || eventList.length === 0) {
    eventDots.value = [];
    updateAttributes();
    return;
  }
  eventDots.value = eventList.map((event, index) => {
    const color = getEventCardColor(
      event,
      checkedInEvents.value,
      registeredEvents.value,
    );
    return {
      key: `event-${index}`,
      dot: { color },
      dates: new Date(event.date),
      popover: { label: event.name },
    };
  });
  updateAttributes();
};

watch(selectedDates, updateAttributes, { deep: true });

watch(
  allEvents,
  (updatedList) => {
    if (Array.isArray(updatedList) && updatedList.length > 0) {
      generateEventDots(updatedList);
    }
  },
  { immediate: true },
);

function handleDayClick(day, event) {
  const isCtrl = event.ctrlKey || event.metaKey;
  const isShift = event.shiftKey;
  onDayClick(day, isCtrl, isShift);
}

function onDayClick(day, isCtrlPressed = false, isShiftPressed = false) {
  const clickedDate = new Date(day.date);
  let newDates = [];
  if (isShiftPressed && lastSelectedDate.value) {
    const start = new Date(Math.min(lastSelectedDate.value, clickedDate));
    const end = new Date(Math.max(lastSelectedDate.value, clickedDate));
    const tempDate = new Date(start);
    while (tempDate <= end) {
      newDates.push(new Date(tempDate));
      tempDate.setDate(tempDate.getDate() + 1);
    }
    selectedDates.value = newDates;
  } else if (isCtrlPressed) {
    const exists = selectedDates.value.find(
      (d) => d.toDateString() === clickedDate.toDateString(),
    );
    if (exists) {
      selectedDates.value = selectedDates.value.filter(
        (d) => d.toDateString() !== clickedDate.toDateString(),
      );
    } else {
      selectedDates.value.push(clickedDate);
    }
  } else {
    selectedDates.value = [clickedDate];
  }
  lastSelectedDate.value = clickedDate;
  updateAttributes();
}

const selectedDateRangeLabel = computed(() => {
  if (selectedDates.value.length === 0) return "";
  const sorted = [...selectedDates.value].sort((a, b) => a - b);
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  const options = { month: "short", day: "numeric", year: "numeric" };
  const startLabel = start.toLocaleDateString(undefined, options);
  const endLabel = end.toLocaleDateString(undefined, options);
  return startLabel === endLabel
    ? `(${startLabel})`
    : `(${startLabel} – ${endLabel})`;
});

const calendarRows = ref(window.innerHeight < 700 ? 1 : 2);
const updateRows = () => {
  calendarRows.value = window.innerHeight < 700 ? 1 : 2;
};

onMounted(async () => {
  updateRows();
  window.addEventListener("resize", updateRows);
  await fetchStudentId();
  await fetchStudentStatus();
  await getEvents(); // <-- Load events here
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateRows);
});

function goToToday() {
  const today = new Date();
  selectedDates.value = [today];
  lastSelectedDate.value = today;
  updateAttributes();
}

function clearSelection() {
  selectedDates.value = [];
  updateAttributes();
}

function selectThisWeek() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay()); // Sunday
  const week = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    week.push(day);
  }
  selectedDates.value = week;
  lastSelectedDate.value = today;
  updateAttributes();
}

function selectThisMonth() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthDates = [];
  for (let i = 1; i <= daysInMonth; i++) {
    monthDates.push(new Date(year, month, i));
  }
  selectedDates.value = monthDates;
  lastSelectedDate.value = today;
  updateAttributes();
}
</script>

<template>
  <div class="calendar-container mt-4 pa-6">
    <div class="calendar-row">
      <!-- Left card: Calendar -->
      <v-card class="calendar-card pa-4 bg-backgroundDarken" flat>
        <div class="d-flex justify-space-between align-center mb-3 px-4">
          <div>
            <v-btn
              color="secondary"
              size="small"
              prepend-icon="mdi-calendar-today"
              @click="goToToday"
            >
              Today
            </v-btn>
            <v-btn
              size="small"
              color="secondary"
              prepend-icon="mdi-calendar-week"
              class="ml-2"
              @click="selectThisWeek"
            >
              This Week
            </v-btn>
            <v-btn
              size="small"
              color="secondary"
              prepend-icon="mdi-calendar-month"
              class="ml-2"
              @click="selectThisMonth"
            >
              This Month
            </v-btn>
          </div>

          <div v-if="selectedDates.length > 1">
            <v-btn
              size="small"
              color="danger"
              prepend-icon="mdi-close-circle-outline"
              @click="clearSelection"
            >
              Clear
            </v-btn>
          </div>
        </div>

        <VCalendar
          :rows="calendarRows"
          :attributes="attributes"
          is-dark="system"
          view="monthly"
          borderless
          title-position="left"
          expanded
          class="fill-height bg-backgroundDarken"
          @dayclick="handleDayClick"
        />
      </v-card>

      <!-- Right card: Timeline -->
      <v-card class="calendarDetails-card pa-4" color="backgroundDarken">
        <div class="timeline-header">
          <strong class="timeline-title">Event Timeline</strong>
          <span class="timeline-range">{{ selectedDateRangeLabel }}</span>
          <v-btn
            v-if="props.isAdmin"
            rounded="xl"
            color="primary"
            @click="handleAdd"
            >Add Event</v-btn
          >
        </div>

        <div v-if="Object.keys(filteredEventsGroupedByDate).length > 0">
          <div
            v-for="(dayEvents, dateLabel) in filteredEventsGroupedByDate"
            :key="dateLabel"
            class="timeline-day"
          >
            <div v-if="dayEvents.length > 0" class="timeline">
              <div
                v-for="(group, time) in groupByStartTime(dayEvents)"
                :key="time"
                class="timeline-item"
              >
                <div class="timeline-time">{{ dateLabel }}</div>
                <div class="timeline-group">
                  <EventCard
                    v-for="(event, idx) in group"
                    :key="idx"
                    :event="event"
                    :view-only="true"
                    color="background"
                    :status="
                      getEventCardColor(
                        event,
                        checkedInEvents,
                        registeredEvents,
                      )
                    "
                    :is-event-viewing="false"
                    :admin-view="props.isAdmin"
                    @click="openDialog(event)"
                    @edit="handleEdit"
                    @cancel="handleCancel"
                  />
                </div>
              </div>
            </div>

            <div v-else>
              <p class="no-events-text">No events for this date.</p>
            </div>
          </div>

          <EventDialog
            v-model="dialogVisible"
            :event="selectedEvent"
            :is-admin="props.isAdmin"
            @record-attendance="handleRecordAttendance"
            @generate-qr="handleGenerateQRCode"
            @register="handleRegister"
            @unregister="handleUnregister"
          />
        </div>

        <div v-else>
          <p>Click a date to view or manage events here.</p>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.timeline-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.timeline-title {
  font-size: 20px;
}

.timeline-range {
  font-size: 16px;
  color: rgb(var(--v-theme-secondary));
}

.calendar-container {
  width: 100%;
  max-width: 150vw;
  overflow: hidden;
}

.calendar-row {
  display: flex;
  justify-content: stretch;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
}

.calendar-card {
  flex-shrink: 0;
  width: 500px;
  border-radius: 25px;
}

.calendarDetails-card {
  flex-grow: 1;
  max-height: 610px;
  overflow-y: auto;
  border-radius: 25px;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
  scrollbar-width: thin;
}

.calendarDetails-card::-webkit-scrollbar {
  width: 8px;
}

.calendarDetails-card::-webkit-scrollbar-thumb {
  background-color: rgba(100, 100, 100, 0.3);
  border-radius: 4px;
}

.fill-height {
  height: 100%;
  flex: 1;
}

.timeline-day {
  margin-bottom: 20px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding-left: 10px;
  border-left: 3px solid rgb(var(--v-theme-text));
}

.timeline-time {
  min-width: 65px;
  width: 95px;
  color: rgb(var(--v-theme-text));
}

.timeline-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.no-events-text {
  font-style: italic;
  color: rgb(var(--v-theme-secondary));
}
</style>
