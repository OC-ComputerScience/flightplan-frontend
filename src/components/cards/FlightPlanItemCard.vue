<script setup>
import { computed, ref, onMounted } from "vue";
import EventListDialog from "../dialogs/EventListDialog.vue";
import EventDialog from "../dialogs/EventDialog.vue";
import eventServices from "../../services/eventServices";
import strengthServices from "../../services/strengthServices";
import studentServices from "../../services/studentServices";
import flightPlanItemServices from "../../services/flightPlanItemServices";
import { isRecommended } from "../../utils/recommended";
import { userStore } from "../../stores/userStore";
import { studentStore } from "../../stores/studentStore";
import { useDisplay } from "vuetify";

const props = defineProps({
  flightPlanItem: {
    type: Object,
    default: () => ({}),
  },
  isAdmin: Boolean,
  isFlightPlanView: Boolean,
  isViewOnly: {
    type: Boolean,
    default: false,
  },
  flightPlanItems: {
    type: Array,
    default: () => [],
  },
  backgroundColor: {
    type: String,
    default: "backgroundDarken",
  },
});

const emit = defineEmits([
  "incomplete",
  "view",
  "register",
  "sign-in",
  "delete",
  "click",
  "refresh",
]);

const store = userStore();
const localStudentStore = studentStore();
const studentId = ref(null);
const registeredEventIds = ref(new Set());
const checkedInEventIds = ref(new Set());

const showEventListDialog = ref(false);
const showEventDialog = ref(false);
const eventOptions = ref([]);
const selectedEvent = ref(null);

const { lgAndUp } = useDisplay();

const isRecommendedFlightPlanItem = ref(false);

const isSubmissionExperience = computed(
  () =>
    props.flightPlanItem.flightPlanItemType === "Experience" &&
    props.flightPlanItem.experience?.submissionType !== "attendance",
);

const isOptional = computed(() => {
  if (props.flightPlanItem.flightPlanItemType === "Experience") {
    return props.flightPlanItem.experience?.schedulingType === "optional";
  } else {
    return props.flightPlanItem.task?.schedulingType === "optional";
  }
});

const eventRequired = computed(() => {
  if (flightPlanItem.value.flightPlanItemType === "Task") return false;
  if (flightPlanItem.value.experience.eventRequired) return true;
  return false;
});

const calculateRecommended = async () => {
  let itemStrengths;
  if (props.flightPlanItem.flightPlanItemType === "Experience") {
    itemStrengths = (
      await strengthServices.getStrengthForExperience(
        props.flightPlanItem.experience?.id,
      )
    ).data;
  } else {
    itemStrengths = (
      await strengthServices.getStrengthForTask(props.flightPlanItem.task?.id)
    ).data;
  }
  if (!localStudentStore.strengths) {
    await localStudentStore.setupStore();
  }

  isRecommendedFlightPlanItem.value = isRecommended(
    localStudentStore.strengths,
    itemStrengths,
  );
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

const loadExperienceEvents = async () => {
  if (!props.flightPlanItem.experience?.id) return;
  try {
    const response = await eventServices.getEventsForExperience(
      props.flightPlanItem.experience.id,
    );
    eventOptions.value = response.data;
  } catch (err) {
    console.error("Failed to fetch fulfilling events:", err);
  }
};

onMounted(async () => {
  calculateRecommended();
  await fetchStudentId();
  await fetchStudentStatus();
  if (props.flightPlanItem.flightPlanItemType === "Experience") {
    await loadExperienceEvents();
  }

  if (props.flightPlanItem.eventId) {
    const response = await eventServices.getEvent(props.flightPlanItem.eventId);
    selectedEvent.value = response.data;
  }
});

const handleRegisterClick = async () => {
  await loadExperienceEvents();
  showEventListDialog.value = true;
};

const handleEventSelected = (event) => {
  selectedEvent.value = event;
};

const handleRegister = async (event) => {
  selectedEvent.value = event;
  if (!studentId.value) return;
  try {
    await eventServices.registerStudents(event.id, [studentId.value]);
    const updatedItem = {
      ...props.flightPlanItem,
      eventId: event.id,
      status: "Registered",
    };
    await flightPlanItemServices.updateFlightPlanItem(updatedItem);
    await fetchStudentStatus();
    emit("refresh");

    handleRefresh();
  } catch (err) {
    console.error("Registration error:", err);
  }
};

const handleUnregister = async (event) => {
  handleEventSelected(event);
  if (!studentId.value) return;
  try {
    await eventServices.unregisterStudents(event.id, [studentId.value]);
    const updatedItem = {
      ...props.flightPlanItem,
      eventId: null,
      status: "Incomplete",
    };
    await flightPlanItemServices.updateFlightPlanItem(updatedItem);
    await fetchStudentStatus();
    handleRefresh();
  } catch (err) {
    console.error("Unregistration error:", err);
  }
};

const handleRefresh = () => {
  showEventListDialog.value = false;
  emit("refresh");
};

const isRegisteredForExperience = computed(() => {
  return props.flightPlanItem.status === "Registered";
});

const color = computed(() => {
  const status = props.flightPlanItem.status;

  if (status === "Complete") return "primary";
  if (isRegisteredForExperience.value) return "warning";
  if (status.includes("Pending") || status.includes("Awaiting"))
    return "warning";

  return (
    {
      Incomplete: "danger",
      Rejected: "danger",
      Pending: "warning",
      Registered: "warning",
    }[status] || "primary"
  );
});

const points = computed(() => {
  return {
    Task: props.flightPlanItem.task?.points,
    Experience: props.flightPlanItem.experience?.points,
  }[props.flightPlanItem.flightPlanItemType];
});

const chipSize = computed(() => {
  return lgAndUp.value ? 1 : 2;
});

const contextSize = computed(() => {
  return lgAndUp.value ? 11 : 10;
});

const handleClick = () => {
  emit("click", props.flightPlanItem);
};

const handleDelete = () => {
  emit("delete", props.flightPlanItem);
};

const checkCompletionAbility = () => {
  if (!["Task", "Experience"].includes(props.flightPlanItem.flightPlanItemType))
    return false;

    if (
    !["Incomplete", "Awaiting Reflection", "Registered"].includes(
      props.flightPlanItem.status,
    )
  )
  
    return false;

    if (props.flightPlanItem.flightPlanItemType === "Task")
    return true;

  if (!props.flightPlanItem.experience?.eventRequired) 
    return true;

  if (props.flightPlanItem.eventId !== null)
    return true;

  return false;

    // (flightPlanItem.flightPlanItemType === "Experience" &&
    //   flightPlanItem.experience?.submissionType !== "Attendance - Auto" &&
    //   flightPlanItem.experience?.submissionType &&
    //   flightPlanItem.eventId !== null) ||
    // flightPlanItem.experience?.submissionType !== "Attendance - Reflection";
};

const handleViewRegisteredEvent = async () => {
  const registeredEvent = eventOptions.value.find(
    (event) => event.id === props.flightPlanItem.eventId,
  );

  if (registeredEvent) {
    selectedEvent.value = registeredEvent;
    showEventDialog.value = true;
  } else {
    try {
      const res = await eventServices.getEvent(props.flightPlanItem.eventId);
      selectedEvent.value = res.data;
      showEventDialog.value = true;
    } catch (err) {
      console.warn("Could not fetch event by ID:", err);
    }
  }
};
</script>

<template>
  <v-card
    :color="props.backgroundColor"
    class="cardContainer pa-0 ma-1"
    @click="handleClick"
  >
    <v-container class="pa-2">
      <v-row no-gutters>
        <v-col :cols="chipSize">
          <v-sheet :color="color" class="accentChip mr-2 h-100"></v-sheet>
        </v-col>

        <v-col :cols="contextSize">
          <v-card-text class="text-no-wrap">
            <v-row>
              <v-tooltip bottom>
                <template #activator="{ props: tooltipProps }">
                  <p v-bind="tooltipProps" class="text-h6 mb-2 truncate-text">
                    {{ flightPlanItem.name }}
                  </p>
                </template>
                <span>{{ flightPlanItem.name }}</span>
              </v-tooltip>
              <v-spacer />
              <v-tooltip
                v-if="isRecommendedFlightPlanItem"
                location="right"
                style="width: 75%"
                bottom
              >
                <template #activator="{ props: recomendedToolTipProps }">
                  <v-icon
                    icon="mdi-star"
                    v-bind="recomendedToolTipProps"
                    size="x-large"
                    color="recommended"
                  />
                </template>
                <span>Recommended based on your Strengths</span>
              </v-tooltip>
            </v-row>
            <p>{{ flightPlanItem.flightPlanItemType }}</p>
            <p>
              {{
                flightPlanItem.status === "Complete"
                  ? "Complete"
                  : isRegisteredForExperience
                    ? "Registered"
                    : flightPlanItem.status
              }}
            </p>
            <p
              :class="[
                'mb-3',
                {
                  'mb-5':
                    ['Complete'].includes(flightPlanItem.status) || isAdmin,
                },
              ]"
            >
              Points: {{ points }}
            </p>
          </v-card-text>

          <div v-if="!isAdmin && !isFlightPlanView && !isViewOnly">
            <v-row justify="end">
              <!-- Submission logic for Task and Experience -->
              <v-btn
                v-if="checkCompletionAbility()"
                class="mr-4 mb-3"
                variant="outlined"
                rounded="xl"
                @click="emit('incomplete', flightPlanItem)"
              >
                Complete
                <v-icon right class="pl-1">mdi-upload</v-icon>
              </v-btn>
              <v-btn
                v-if="
                  ['Task', 'Experience'].includes(
                    flightPlanItem.flightPlanItemType,
                  ) &&
                  flightPlanItem.status === 'Rejected' &&
                  (flightPlanItem.flightPlanItemType === 'Task' ||
                    isSubmissionExperience)
                "
                class="mr-4 mb-3"
                variant="outlined"
                rounded="xl"
                @click="emit('incomplete', flightPlanItem)"
              >
                Rejected
                <v-icon right class="pl-1">mdi-upload</v-icon>
              </v-btn>

              <!-- Attendance-based Experience Registration -->
              <v-btn
                v-if="
                  (flightPlanItem.flightPlanItemType === 'Experience' &&
                    flightPlanItem.experience?.submissionType.includes(
                      'Attendance',
                    ) &&
                    flightPlanItem.status === 'Incomplete' &&
                    !flightPlanItem.status.includes('Pending')) ||
                  (flightPlanItem.flightPlanItemType === 'Experience' &&
                    flightPlanItem.experience?.eventRequired &&
                    flightPlanItem.status === 'Incomplete' &&
                    !flightPlanItem.status.includes('Pending'))
                "
                class="mr-4 mb-3"
                variant="outlined"
                rounded="xl"
                @click="handleRegisterClick"
              >
                Register
                <v-icon right class="pl-1">mdi-account-plus</v-icon>
              </v-btn>

              <!-- View Submission -->
              <v-btn
                v-if="
                  ['Task', 'Experience'].includes(
                    flightPlanItem.flightPlanItemType,
                  ) &&
                  flightPlanItem.status.includes ('Pending') &&
                  (flightPlanItem.flightPlanItemType === 'Task' ||
                    isSubmissionExperience)
                "
                class="mr-4 mb-3"
                variant="outlined"
                rounded="xl"
                @click="emit('view', flightPlanItem)"
              >
                View Submission
                <v-icon right class="pl-1">mdi-eye</v-icon>
              </v-btn>
              <!-- Registered/Pending Attendance Event View -->
              <v-btn
                v-if="
                  ['Pending Review', 'Registered'].includes(
                    flightPlanItem.status,
                  ) &&
                  flightPlanItem.flightPlanItemType === 'Experience' &&
                  flightPlanItem.experience?.submissionType === 'attendance'
                "
                class="mr-4 mb-3"
                variant="outlined"
                rounded="xl"
                @click="handleViewRegisteredEvent"
              >
                View Registered Event
                <v-icon right class="pl-1">mdi-calendar</v-icon>
              </v-btn>
              <v-btn
                v-if="
                  !isAdmin &&
                  isOptional &&
                  !['Complete'].includes(flightPlanItem.status)
                "
                class="mr-4 mb-3"
                variant="outlined"
                rounded="xl"
                @click="handleDelete"
                ><v-icon>mdi-delete</v-icon></v-btn
              >
            </v-row>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-card>

  <EventListDialog
    v-model="showEventListDialog"
    :experience-id="flightPlanItem.id"
    :event-options="eventOptions"
    :flight-plan-item="flightPlanItem"
    :flight-plan-items="flightPlanItems"
    @register="handleRegister"
    @unregister="handleUnregister"
    @refresh="handleRefresh"
  />

  <EventDialog
    v-model="showEventDialog"
    :event="selectedEvent"
    :is-admin="isAdmin"
    @register="handleRegister"
    @unregister="handleUnregister"
  />
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
.thick-border {
  border: 2px solid rgb(var(--v-theme-primary));
}
</style>
