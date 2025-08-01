<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from "vue";
import EventCard from "../cards/EventCard.vue";
import studentServices from "../../services/studentServices";
import eventServices from "../../services/eventServices";
import { userStore } from "../../stores/userStore";
import dayjs from "dayjs";
import { useEventCheckIn } from "../../utils/useEventCheckin";
import flightPlanItemServices from "../../services/flightPlanItemServices";

const props = defineProps({
  modelValue: Boolean,
  experienceId: {
    type: Number,
    default: null,
  },
  eventOptions: {
    type: Array,
    default: () => [],
  },
  flightPlanItem: {
    type: Object,
    default: () => ({}),
  },
  flightPlanItems: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "update:modelValue",
  "select",
  "register",
  "refresh",
]);

const { checkIfStudentIsRegistered } = useEventCheckIn();
const store = userStore();
const studentId = ref(null);
const statusReady = ref(false);
const registeredEventIds = ref(new Set());
const checkedInEventIds = ref(new Set());
const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
const selectedEvent = ref(null);
const successMessage = ref("");
const fpisWithEvents = ref([]);
const flightPlanItemCopy = ref({ ...props.flightPlanItem });

watch(
  () => props.flightPlanItem,
  (newVal) => {
    flightPlanItemCopy.value = { ...newVal };
  },
);

const selectEvent = (event) => {
  selectedEvent.value = event;
};

const fetchFlightPlanItemsWithEvents = async () => {
  if (!studentId.value || !props.flightPlanItem?.flightPlanId) return;
  try {
    const res =
      await flightPlanItemServices.getFlightPlanItemsWithEventsForStudent(
        studentId.value,
        props.flightPlanItem.flightPlanId,
      );
    fpisWithEvents.value = res.data;
  } catch (err) {
    console.error("Failed to fetch FPIs with events:", err);
  }
};

const formatDate = (date) => dayjs(date).format("dddd, MMMM D");
const formatTime = (start, end) =>
  `${dayjs(start).format("h:mma")} - ${dayjs(end).format("h:mma")}`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const register = async () => {
  successMessage.value = "Successfully registered!";
  await checkIfStudentIsRegistered();
  await delay(2000);
  successMessage.value = "";
  emit("register", selectedEvent.value);
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
    registeredEventIds.value = new Set(registeredRes.data.map((e) => e.id));
    checkedInEventIds.value = new Set(checkedInRes.data.map((e) => e.id));
  } catch (err) {
    console.error("Error fetching student status:", err);
  }
};

const matchedFlightPlanItem = computed(() => {
  if (!selectedEvent.value || !fpisWithEvents.value.length) return null;
  return fpisWithEvents.value.find(
    (item) => item.eventId === selectedEvent.value.id,
  );
});

onMounted(async () => {
  await fetchStudentId();
  await fetchStudentStatus();
  await fetchFlightPlanItemsWithEvents();
  statusReady.value = true;
});

// onUnmounted(async () => {
//   await fetchFlightPlanItemsWithEvents();
// });

watch(internalValue, async (val) => {
  if (val) {
    statusReady.value = false;
    await fetchStudentStatus();
    statusReady.value = true;
  }
});

const eventColors = computed(() => {
  const colorMap = {};
  props.eventOptions?.forEach((event) => {
    const isRegistered = registeredEventIds.value.has(event.id);
    const isCheckedIn = checkedInEventIds.value.has(event.id);
    const isUsedInOtherFPI = fpisWithEvents.value.some(
      (item) =>
        item.eventId === event.id && item.id !== props.flightPlanItem.id,
    );
    if (isCheckedIn && !isUsedInOtherFPI) {
      colorMap[event.id] = "success";
    } else if (!isCheckedIn && !isUsedInOtherFPI && isRegistered) {
      colorMap[event.id] = "warning";
    } else if (!isCheckedIn && !isUsedInOtherFPI && !isRegistered) {
      colorMap[event.id] = "primary";
    } else {
      colorMap[event.id] = "danger";
    }
  });
  return colorMap;
});

const eventStatusLabels = computed(() => {
  const labelMap = {};
  props.eventOptions?.forEach((event) => {
    const isRegistered = registeredEventIds.value.has(event.id);
    const isCheckedIn = checkedInEventIds.value.has(event.id);
    const isUsedInOtherFPI = fpisWithEvents.value.some(
      (item) =>
        item.eventId === event.id && item.id !== props.flightPlanItem.id,
    );
    if (isCheckedIn && isUsedInOtherFPI) {
      labelMap[event.id] = "Conflict";
    } else if (isCheckedIn && !isUsedInOtherFPI) {
      labelMap[event.id] = "Checked in & Eligible";
    } else if (isUsedInOtherFPI && isRegistered) {
      labelMap[event.id] = "Registered & Conflict";
    } else if (!isCheckedIn && !isUsedInOtherFPI && !isRegistered) {
      labelMap[event.id] = "Eligible";
    } else {
      labelMap[event.id] = "Registered & Eligible";
    }
  });
  return labelMap;
});

const getEventPriority = (event) => {
  const isRegistered = registeredEventIds.value.has(event.id);
  const isCheckedIn = checkedInEventIds.value.has(event.id);
  const isUsedInOtherFPI = fpisWithEvents.value.some(
    (item) => item.eventId === event.id && item.id !== props.flightPlanItem.id,
  );
  if (isCheckedIn && !isUsedInOtherFPI) return 0;
  if (!isCheckedIn && !isUsedInOtherFPI && isRegistered) return 1;
  if (!isCheckedIn && !isUsedInOtherFPI && !isRegistered) return 2;
  if (isUsedInOtherFPI && isRegistered) return 3;
  if (isCheckedIn && isUsedInOtherFPI) return 4;
  return 5;
};

const sortedEventOptions = computed(() => {
  return [...props.eventOptions].sort(
    (a, b) => getEventPriority(a) - getEventPriority(b),
  );
});

const fulfillExperience = async (event) => {
  flightPlanItemCopy.value.eventId = event.id;
  flightPlanItemCopy.value.status = "Registered";
  await flightPlanItemServices.updateFlightPlanItem(flightPlanItemCopy.value);
  successMessage.value = "Successfully fulfilled!";
  await delay(2000);
  successMessage.value = "";
  emit("refresh");
};

const completeExperience = async (event) => {
  flightPlanItemCopy.value.eventId = event.id;
  flightPlanItemCopy.value.status = "Complete";
  var earnedPoints = flightPlanItemCopy.value.experience.points;
  await flightPlanItemServices.updateFlightPlanItem(flightPlanItemCopy.value);
  await studentServices.updatePoints(studentId.value, earnedPoints);
  successMessage.value = "Successfully completed!";
  await delay(2000);
  successMessage.value = "";
  emit("refresh");
};
</script>

<template>
  <v-dialog v-model="internalValue" max-width="1000px">
    <v-card class="rounded-xl" color="backgroundDarken">
      <v-card-title
        class="text-h6 d-flex justify-space-between align-center px-6 pt-4"
      >
        <span class="font-weight-regular">
          Qualifying Events for
          <strong class="text-lg font-weight-bold mx-1">
            {{ props.flightPlanItem.name }}
          </strong>
          Flight Plan Experience:
        </span>
        <v-icon class="cursor-pointer" @click="internalValue = false">
          mdi-close
        </v-icon>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text v-if="statusReady && eventOptions?.length > 0" class="pa-0">
        <v-row no-gutters style="height: 500px; overflow: hidden">
          <v-col
            cols="5"
            class="pa-4"
            style="
              height: 100%;
              max-height: 500px;
              overflow-y: auto;
              border-right: 1px solid rgba(255, 255, 255, 0.1);
            "
          >
            <EventCard
              v-for="(event, idx) in sortedEventOptions"
              :key="event.id || idx"
              :event="event"
              :view-only="true"
              :no-actions="true"
              :status="eventColors[event.id] || 'primary'"
              :status-label="eventStatusLabels[event.id] || ''"
              :is-event-viewing="false"
              :class="[
                'event-card',
                {
                  selected: selectedEvent && selectedEvent.id === event.id,
                  faded: selectedEvent && selectedEvent.id !== event.id,
                },
              ]"
              color="background"
              @click="selectEvent(event)"
            />
          </v-col>

          <v-col cols="7" class="pa-4 d-flex flex-column justify-start">
            <v-card
              v-if="selectedEvent"
              class="pa-4 rounded-xl flex-grow-1"
              color="background"
            >
              <h3 class="text-h6">{{ selectedEvent.name }}</h3>
              <p>{{ selectedEvent.description }}</p>
              <p>
                <strong>Location:</strong>
                {{ selectedEvent.location || "No Location" }}
              </p>
              <p>
                <strong>Date:</strong>
                {{ formatDate(selectedEvent.date) }}
              </p>
              <p>
                <strong>Time:</strong>
                {{ formatTime(selectedEvent.startTime, selectedEvent.endTime) }}
              </p>
              <p>
                <strong>Attendance:</strong>
                {{ selectedEvent.attendanceType }}
              </p>
              <p>
                <strong>Registration:</strong>
                {{ selectedEvent.registration }}
              </p>

              <div v-if="successMessage">
                <v-alert
                  type="success"
                  variant="tonal"
                  class="mt-4 text-center"
                >
                  {{ successMessage }}
                </v-alert>
              </div>
              <div v-else>
                <v-btn
                  v-if="!registeredEventIds.has(selectedEvent.id)"
                  :class="'mt-4'"
                  color="primary"
                  rounded="xl"
                  block
                  @click="register"
                >
                  Register
                </v-btn>

                <p
                  v-else-if="matchedFlightPlanItem"
                  class="mt-4 text-left text-medium-emphasis"
                >
                  Event fulfilling
                  <strong>{{ matchedFlightPlanItem.name }}</strong>
                  Flight Plan Experience
                </p>

                <v-btn
                  v-else-if="
                    eventStatusLabels[selectedEvent.id] ===
                    'Checked in & Eligible'
                  "
                  :class="'mt-4'"
                  color="success"
                  rounded="xl"
                  block
                  @click="completeExperience(selectedEvent)"
                >
                  <span class="font-weight-regular">
                    Complete
                    <strong class="font-weight-bold mx-1">
                      {{ flightPlanItem.name }}
                    </strong>
                  </span>
                </v-btn>

                <v-btn
                  v-else
                  :class="'mt-4'"
                  color="primary"
                  rounded="xl"
                  block
                  @click="fulfillExperience(selectedEvent)"
                >
                  <span class="font-weight-regular">
                    Fulfill
                    <strong class="font-weight-bold mx-1">
                      {{ flightPlanItem.name }}
                    </strong>
                  </span>
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text v-else-if="statusReady && eventOptions?.length === 0">
        <p class="text-center text-medium-emphasis mb-5">
          No qualifying events for this experience yet.
        </p>
      </v-card-text>

      <v-card-text v-else>
        <v-skeleton-loader
          v-for="i in 3"
          :key="i"
          type="list-item"
          class="my-2"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.event-card {
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.event-card.selected {
  border: 1px solid rgba(var(--v-theme-text));
  background-color: rgba(25, 118, 210, 0.1);
}
</style>
