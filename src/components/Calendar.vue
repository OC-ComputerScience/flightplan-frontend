<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import EventCard from "./cards/EventCard.vue";
import SelectEventExperience from "./dialogs/SelectEventExperience.vue";
import ConfirmDialog from "./dialogs/ConfirmDialog.vue";
import { useRouter } from "vue-router";
import eventServices from "../services/eventServices";
import strengthServices from "../services/strengthServices";
import studentServices from "../services/studentServices";
import { userStore } from "../stores/userStore";
import { studentStore } from "../stores/studentStore";
import { viewSelectEventExperienceStore } from "../stores/viewSelectEventExperienceStore";
import { getEventCardColor } from "../utils/eventStatus";
import { createEventCancelNotification } from "../utils/notificationHandler";
import { formatTime } from "../utils/dateTimeHelpers";

import flightPlanServices from "../services/flightPlanServices";
import flightPlanItemServices from "../services/flightPlanItemServices";
import experienceServices from "../services/experienceServices";
import { createOptionalFlightPlanExperience } from "../utils/flightPlanExperienceItemHelper";

import EventRegistrationConfirmation from "../components/dialogs/EventRegistrationConfirmation.vue";
import { eventRegistrationConfirmationStore } from "../stores/eventRegistrationConfirmationStore";
const registrationUpdateMessage = ref("")
const useEventRegistrationConfirmationStore = eventRegistrationConfirmationStore();


const store = userStore();
const localStudentStore = studentStore();
const viewSelectExperienceStore = viewSelectEventExperienceStore();
const flightPlanItems = ref([]);
const studentId = ref(null);
const student = ref(null);

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

const selectedEvent = ref({});
const registeredEvents = ref([]);
const checkedInEvents = ref([]);
const cancelledEvents = ref([]);
const allEvents = ref([]); // Local ref for all events

const confirmCancelDialog = ref(false);
const eventToCancel = ref(null);
const eventToCancelObject = ref(null);

const getEvents = async () => {
  try {
    const result = await eventServices.getAllEvents(1, 1000);
    allEvents.value = result.data.events;
  } catch (error) {
    console.error("Failed to refresh events:", error);
  }
};

const handleEdit = (eventId) =>
  router.push({ name: "editEvent", params: { id: eventId } });

const handleCancel = (eventId) => {
  eventToCancel.value = eventId;
  eventToCancelObject.value = allEvents.value.find(
    (event) => event.id === eventId,
  );
  confirmCancelDialog.value = true;
};

const confirmCancel = async () => {
  try {
    await eventServices.updateEvent(eventToCancel.value, {
      status: "Cancelled",
    });

    var registeredStudents = [];

    await eventServices
      .getRegisteredStudents(eventToCancel.value)
      .then((res) => {
        if (res.data !== null) {
        res.data.forEach((student) => {
          registeredStudents.push(student.studentId);

          eventToCancelObject.value.date = new Date(
            eventToCancelObject.value.date,
          ).toLocaleDateString();
          eventToCancelObject.value.startTime = formatTime(
            new Date(eventToCancelObject.value.startTime),
          );
          eventToCancelObject.value.endTime = formatTime(
            new Date(eventToCancelObject.value.endTime),
          );

          createEventCancelNotification(
            eventToCancelObject.value,
            student.user.id,
            true,
            1,
            student.user.email,
          );
        });
      }


      })
      .catch((err) => {
        console.error("Error creating notifcation: ", err);
      });

      if (registeredStudents.length > 0) {
    await eventServices.unregisterStudents(
      eventToCancel.value,
      registeredStudents,
    );
      }

    cancelledEvents.value.push(eventToCancel.value);
    await getEvents();
    if (selectedEvent.value && selectedEvent.value.id === eventToCancel.value) {
      const updatedEvent = await eventServices.getEvent(eventToCancel.value);
      selectedEvent.value = updatedEvent.data;
    }
    await fetchStudentStatus();
  } catch (err) {
    console.error("Error cancelling event:", err);
  }
};

const handleAdd = () => {
  router.push({
    name: "addEvent",
    params: {
      date: selectedDates.value[0].toISOString(),
    },
  });
};

const handleRegisterEventExperience = async (event, flightPlanItem = null) => {
  if (!studentId.value) return;
  try {
    await eventServices.registerStudents(event.id, [studentId.value]);

    if (flightPlanItem) {
      const updatedItem = {
        ...flightPlanItem,
        eventId: event.id,
        status: "Registered",
      };
      await flightPlanItemServices.updateFlightPlanItem(updatedItem);
    }

    await fetchStudentStatus();
    const updatedEvent = await eventServices.getEvent(event.id);
    registrationUpdateMessage.value = "Successfully registered for the event! You will receive email notifications as the event approaches"
    useEventRegistrationConfirmationStore.toggleVisibility(true);
    useEventRegistrationConfirmationStore.toggleRegistration(true)
    selectedEvent.value = updatedEvent.data; // <-- Force refresh of event
  } catch (err) {
    console.error("Registration error:", err);
  }
};

const handleRegister = async (event) => {
  if (!studentId.value) return;
  const eventExperiences = (
    await experienceServices.getAllExperiencesForEvent(event.id)
  ).data;

  if (eventExperiences.length > 0) {
    const currentFlightPlan = (
      await flightPlanServices.getFlightPlanForStudentAndSemester(
        studentId.value,
        student.value.semestersFromGrad,
      )
    ).data;
    flightPlanItems.value = (
      await flightPlanItemServices.getAllFlightPlanItemsForFlightPlan(
        currentFlightPlan.id,
        { page: 1, pageSize: 1000 },
      )
    ).data.flightPlanItems.filter((item) =>
      eventExperiences.some(
        (experience) =>
          experience.id == item.experienceId && item.status === "Incomplete",
      ),
    );

    if (flightPlanItems.value.length === 0) {
      const optionalFlightPlanItem = await createOptionalFlightPlanExperience(
        event,
        eventExperiences[0],
        currentFlightPlan,
      );
      handleRegisterEventExperience(event, optionalFlightPlanItem);
    } else if (flightPlanItems.value.length === 1) {
      handleRegisterEventExperience(event, flightPlanItems.value[0]);
    } else {
      selectedEvent.value = event;
      viewSelectExperienceStore.toggleVisibility();
    }
  } else {
    handleRegisterEventExperience(event);
  }
};

const handleUnregisterEventExperience = async (
  event,
  flightPlanItems = null,
) => {
  if (!studentId.value) return;
  try {
    await eventServices.unregisterStudents(event.id, [studentId.value]);

    if (flightPlanItems[0]?.optional) {
      flightPlanItemServices.deleteFlightPlanItem(flightPlanItems[0].id);
    } else if (flightPlanItems && flightPlanItems.length == 1) {
      const updatedItem = {
        ...flightPlanItems[0],
        eventId: null,
        status: "Incomplete",
      };
      await flightPlanItemServices.updateFlightPlanItem(updatedItem);
    }
    await fetchStudentStatus();
    const updatedEvent = await eventServices.getEvent(event.id);
    registrationUpdateMessage.value = "Successfully unregistered from the event"
    useEventRegistrationConfirmationStore.toggleVisibility(true);
    useEventRegistrationConfirmationStore.toggleRegistration(false);
    selectedEvent.value = updatedEvent.data; // <-- Force refresh of event
  } catch (err) {
    console.error("Unregistration error:", err);
  }
};

const handleUnregister = async (event) => {
  if (!studentId.value) return;
  const eventExperiences = (
    await experienceServices.getAllExperiencesForEvent(event.id)
  ).data;
  if (eventExperiences.length > 0) {
    const currentFlightPlan = (
      await flightPlanServices.getFlightPlanForStudentAndSemester(
        studentId.value,
        student.value.semestersFromGrad,
      )
    ).data;
    flightPlanItems.value = (
      await flightPlanItemServices.getAllFlightPlanItemsForFlightPlan(
        currentFlightPlan.id,
        { page: 1, pageSize: 1000 },
      )
    ).data.flightPlanItems.filter((item) => item.eventId === event.id);
    handleUnregisterEventExperience(event, flightPlanItems.value);
  } else {
    handleUnregisterEventExperience(event);
  }
};

const fetchStudentId = async () => {
  try {
    const userId = store.user?.userId;
    if (!userId) return;
    const res = await studentServices.getStudentForUserId(userId);
    studentId.value = res.data.id;
    student.value = res.data;
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

    cancelledEvents.value = allEvents.value.filter(
      (event) => event.status === "Cancelled",
    );
    await generateEventDots(allEvents.value);
  } catch (err) {
    console.error("Error fetching student status:", err);
  }
};

const today = new Date();
const selectedDates = ref([today]);
const lastSelectedDate = ref(null);

const interactiveAttribute = ref({
  highlight: true,
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

const generateEventDots = async (eventList) => {
  if (!localStudentStore.strengths) {
    await localStudentStore.setupStore();
  }

  if (!Array.isArray(eventList) || eventList.length === 0) {
    eventDots.value = [];
    updateAttributes();
    return;
  }
  eventDots.value = await Promise.all(
    eventList.map(async (event, index) => {
      let eventStrengths = [];
      if (localStudentStore.strengths?.length > 0 && event.status !== "Past") {
        eventStrengths = (await strengthServices.getStrengthForEvent(event.id))
          .data;
      }
      const color = getEventCardColor(
        event,
        checkedInEvents.value,
        registeredEvents.value,
        cancelledEvents.value,
        localStudentStore.strengths || [],
        eventStrengths || [],
      );
      return {
        key: `event-${index}`,
        dot: { color },
        dates: new Date(event.date),
        popover: { label: event.name },
      };
    }),
  );
  updateAttributes();
};

watch(selectedDates, updateAttributes, { deep: true });

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
  await getEvents(); // <-- Load events here
  await fetchStudentStatus();
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
          <v-tooltip location="right" style="width: 75%">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="24" class="ml-2"
                >mdi-information-outline</v-icon
              >
            </template>
            <span>
              To view more than one day at a time, click on the first date and
              shift+click on another date to select a range of date, or
              ctrl+click on several dates to select a specific group of
              dates.</span
            >
          </v-tooltip>
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
          <p class="timeline-range" style="padding: 5px">
            What do these colors mean?
            <v-tooltip location="right">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" size="24" class="ml-2"
                  >mdi-information-outline</v-icon
                >
              </template>
              <span>
                <div class="pb-1">
                  <v-icon color="upcoming">mdi-circle</v-icon>:
                  <strong>Upcoming</strong>
                </div>
                <div class="pb-1">
                  <v-icon color="registered">mdi-circle</v-icon>:
                  <strong>Registered</strong>
                </div>
                <div class="pb-1">
                  <v-icon color="checkedin">mdi-circle</v-icon>:
                  <strong>Completed</strong>
                </div>
                <div class="pb-1">
                  <v-icon color="recommended">mdi-circle</v-icon>:
                  <strong>Recommended</strong>
                </div>
                <div class="pb-1">
                  <v-icon color="cancelled">mdi-circle</v-icon>:
                  <strong>Cancelled</strong>
                </div>
                <div class="pb-1">
                  <v-icon color="past">mdi-circle</v-icon>:
                  <strong>Past</strong>
                </div>
              </span>
            </v-tooltip>
          </p>
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
                <div class="timeline-time">
                  <strong>{{ dateLabel }}</strong>
                </div>
                <div class="timeline-group">
                  <EventCard
                    v-for="(event, idx) in group"
                    :key="idx"
                    :event="event"
                    :view-only="true"
                    :status="
                      getEventCardColor(
                        event,
                        checkedInEvents,
                        registeredEvents,
                        cancelledEvents,
                      )
                    "
                    :admin-view="props.isAdmin"
                    @edit="handleEdit"
                    @cancel="handleCancel"
                    @register="handleRegister"
                    @unregister="handleUnregister"
                  />
                </div>
              </div>
            </div>

            <div v-else>
              <p class="no-events-text">No events for this date.</p>
            </div>
          </div>

          <ConfirmDialog
            v-model="confirmCancelDialog"
            title="Cancel Event?"
            confirm-text="Yes, Cancel Event"
            cancel-text="No, Close"
            confirm-color="error"
            @confirm="confirmCancel"
          />

          <SelectEventExperience
            :event="selectedEvent"
            :flight-plan-items="flightPlanItems"
            @register="handleRegisterEventExperience"
          />
        </div>

        <div v-else>
          <p>Click a date to view or manage events here.</p>
        </div>
      </v-card>
    </div>
  </div>
    <EventRegistrationConfirmation
    v-model="useEventRegistrationConfirmationStore.visible"
    :message="registrationUpdateMessage"
  />
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
  width: 550px;
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
