<script setup>
import { computed, ref, onMounted, watch } from "vue";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { userStore } from "../../stores/userStore";
import { isRecommended } from "../../utils/recommended";
import { studentStore } from "../../stores/studentStore";
import eventServices from "../../services/eventServices";
import strengthServices from "../../services/strengthServices";
import studentServices from "../../services/studentServices";
import Utils from "../../config/utils.js";
import ConfirmDialog from "../dialogs/ConfirmDialog.vue";
import { createEventCancelNotification } from "../../utils/notificationHandler";

dayjs.extend(advancedFormat);

const emit = defineEmits([
  "edit",
  "cancel",
  "delete",
  "show-info",
  "register",
  "unregister",
  "click",
]);
const store = userStore();
const localStudentStore = studentStore();

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  viewOnly: { // true - students, false - admin
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: "primary",
  },
  statusLabel: {
    type: String,
    default: "",
  },
  adminView: {
    type: Boolean,
    default: false,
  },
  noActions: {
    type: Boolean,
    default: false,
  },
  registerOnly: {
    type: Boolean,
    default: false,
  }
});

const isRegistered = ref(false);
const confirmCancelDialog = ref(false);
const canCancel = ref(true);
const isRecommendedEvent = ref(false);

const calculateRecommended = async () => {
  const eventStrengths = (
    await strengthServices.getStrengthForEvent(props.event.id)
  ).data;
  if (!localStudentStore.strengths) {
    await localStudentStore.setupStore();
  }

  isRecommendedEvent.value = isRecommended(
    localStudentStore.strengths,
    eventStrengths,
  );
};

onMounted(async () => {
  calculateRecommended();
  let userId = Utils.getStore("user").userId;
  await studentServices
    .getStudentForUserId(userId)
    .then(async (res) => {
      if (res.data) {
        await eventServices
          .getRegisteredEventsForStudent(res.data.id)
          .then((response) => {
            isRegistered.value = response.data.some(
              (event) => event.id === props.event.id,
            );
          })
          .catch((err) => {
            console.error("Error: ", err);
          });
      }
    })
    .catch((err) => {
      console.error("Error: ", err);
    });
});

const eventDate = computed(() => {
  const dateString = dayjs(props.event.date).format("dddd, MMMM Do");
  return dateString;
});

const eventTime = computed(() => {
  const startTime = dayjs(props.event.startTime).format("h:mma");
  const endTime = dayjs(props.event.endTime).format("h:mma");

  return `${startTime} - ${endTime}`;
});

const viewCard = () => {
  emit("click", props.event);
};

const editEvent = () => {
  emit("edit", props.event.id);
};

const directCancel = () => {
  confirmCancelDialog.value = true;
};

const confirmCancel = async () => {
  try {
    await eventServices.updateEvent(props.event.id, {
      status: "Cancelled",
    });

    var registeredStudents = [];

    await eventServices
      .getRegisteredStudents(props.event.id)
      .then((res) => {
        res.data.forEach((student) => {
          registeredStudents.push(student.studentId);

          var eventToCancelObject = {
            id: props.event.id,
            name: props.event.name,
            date: props.event.date,
            startTime: props.event.startTime,
            endTime: props.event.endTime,
            location: props.event.location,
          };

          eventToCancelObject.date = new Date(
            eventToCancelObject.date,
          ).toLocaleDateString();
          eventToCancelObject.startTime = formatTime(
            new Date(eventToCancelObject.startTime),
          );
          eventToCancelObject.endTime = formatTime(
            new Date(eventToCancelObject.endTime),
          );

          createEventCancelNotification(
            eventToCancelObject,
            student.user.id,
            true,
            null, 
            student.user.email
          );
        });
        canCancel.value = false;
      })
      .catch((err) => {
        console.error("Error creating notifcation: ", err);
      });

    if (registeredStudents.length > 0) await eventServices.unregisterStudents(props.event.id, registeredStudents);
  } catch (err) {
    console.error("Error cancelling event:", err);
  }
};

watch(() => props.event.status, (newStatus) => {
  canCancel.value = newStatus !== 'Cancelled';
}, { immediate: true });

const cancelEvent = () => {
  emit("cancel", props.event.id);
};

const showEventInfo = () => {
  emit("show-info", props.event.id);
};

const resolvedStatusLabel = computed(() => {
  if (props.statusLabel && props.statusLabel !== "primary") {
    return props.statusLabel;
  }


  if (props.adminView) {
    switch (props.status) {
      case "checkedin":
        return "Upcoming";
      case "canceled":
        return "Cancelled";
      case "past":
        return "Passed";
      case "registered":
        return "Upcoming"
      case "upcoming":
        return "Upcoming";
      default:
        return "Upcoming";
    }
  } else {
    switch (props.status) {
      case "checkedin":
        return "Checked In";
      case "canceled":
        return "Cancelled";
      case "past":
        return "registered";
      case "registered":
        return "Registered"
      case "upcoming":
        return "Upcoming (Not Registered)";
      default:
        return "Upcoming";
    }
  }
});

const handleRegistration = () => {
  try {
    if (isRegistered.value) {
      emit("unregister", props.event);
      isRegistered.value = false;
    } else {
      emit("register", props.event);
      isRegistered.value = true;
    }
  } catch (error) {
    console.error("Registration failed:", error);
  }
};
</script>

<template>
  <v-card v-if="!viewOnly" color="backgroundDarken" class="cardContainer">
    <v-row no-gutters>
      <v-col>
        <v-card-text>
          <p class="text-h5 text-no-wrap text-truncate">
            {{ props.event.name }} <strong>{{ props.event.status === "Cancelled" ? "(Cancelled)" : "" }}</strong>
          </p>
          <p
            class="text-subtitle-1 font-weight-regular text-no-wrap text-truncate"
          >
            {{ props.event.location || "No Location" }}
          </p>
          <p class="text-subtitle-1 font-weight-regular">
            {{ eventDate }}
          </p>
          <p class="text-subtitle-1 font-weight-regular">
            {{ eventTime }}
          </p>
          <p class="text-subtitle-2 font-weight-medium">
            Event Status: {{ resolvedStatusLabel }}
          </p>
        </v-card-text>
        <v-row class="ma-2 float-right">
          <v-btn
            color="primary"
            class="mr-2 cardButton elevation-0"
            @click="showEventInfo"
          >
            <v-icon icon="mdi-eye" color="text" size="x-large"></v-icon>
          </v-btn>
          <v-btn
            color="warning"
            class="mr-2 cardButton elevation-0"
            @click="editEvent"
          >
            <v-icon icon="mdi-pencil" color="text" size="x-large"></v-icon>
          </v-btn>

          <v-btn
            v-if="canCancel"
            color="error"
            class="mr-2 cardButton elevation-0"
            @click="directCancel()"
          >
            <v-icon icon="mdi-cancel" color="text" size="x-large"></v-icon>
          </v-btn>
        </v-row>
      </v-col>
    </v-row>
  </v-card>
  <v-card
    v-else
    color="background"
    class="cardContainer mb-2"
    @click="viewCard"
  >
    <v-row no-gutters>
      <div class="h-fill left-accent my-2 ml-2" :class="`bg-${status}`"></div>
      <v-col>
        <v-card-text>
          <v-row no-gutters align="center">
            <p class="text-h6 text-truncate">
              {{ props.event.name }}
              <strong>{{
                props.event.status === "Cancelled" ? "(Cancelled)" : ""
              }}</strong>
            </p>
            <v-spacer></v-spacer>
            <v-tooltip
              v-if="isRecommendedEvent"
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
          <p v-if="props.noActions && !props.adminView"class="text-subtitle-2 font-weight-regular">
            {{ eventDate}}
          </p>
          <p class="text-subtitle-2 font-weight-regular">
            {{ props.event.location }}
          </p>
          <p class="text-subtitle-2 font-weight-regular">
            {{ props.event.description }}
          </p>

          <p class="text-subtitle-2 font-weight-regular">
            {{ eventTime }}
          </p>
          <p class="text-subtitle-2 font-weight-medium">
            Event Status: {{ resolvedStatusLabel }}
          </p>
        </v-card-text>
        <v-row v-if="props.adminView && !props.noActions && props.event.status !== 'Cancelled' && props.event.status !== 'Past'" class="ma-2 float-left">
          <v-btn
            color="warning"
            class="mr-2 cardButton elevation-0"
            @click.stop="editEvent"
          >
            <v-icon 
            color="text" 
            size="x-large"
            :icon='props.event.status !== "Cancelled" && props.event.status !== "Past" ? "mdi-pencil" : "mdi-eye"'>
            </v-icon>
          </v-btn>
          <v-btn
            v-if="props.event.status !== 'Cancelled' && props.event.status !== 'Past'"
            color="error"
            class="mr-2 cardButton elevation-0"
            @click.stop="cancelEvent"
          >
            <v-icon icon="mdi-cancel" color="text" size="x-large"></v-icon>
          </v-btn>
        </v-row>
        <v-row v-else-if="!props.noActions || props.registerOnly" class="ma-2 float-left">
          <v-btn
            v-if="isRegistered && props.event.status === 'Upcoming' && resolvedStatusLabel !== 'Checked In'"
            color="error"
            class="mr-2 cardButton elevation-0"
            @click.stop.prevent="handleRegistration"
          >
            {{ "Unregister" }}</v-btn
          >
          <v-btn
            v-else-if="!isRegistered && props.event.status === 'Upcoming' && resolvedStatusLabel !== 'Checked In'"
            color="primary"
            class="mr-2 cardButton elevation-0"
            @click.stop.prevent="handleRegistration"
          >
            {{ "Register" }}</v-btn
          >
        </v-row>
      </v-col>
    </v-row>
  </v-card>
  <ConfirmDialog
    v-model="confirmCancelDialog"
    title="Cancel Event?"
    confirm-text="Yes, Cancel Event"
    cancel-text="No, Close"
    confirm-color="error"
    @confirm="confirmCancel"
  />
</template>

<style scoped>
.left-accent {
  width: 20px;
  border-radius: 20px 0px 0px 20px;
}

.cardContainer {
  min-width: 250px;
  border-radius: 25px;
}

.card-radius {
  border-radius: 25px;
}

.cardButton {
  border-radius: 13px;
}
</style>
