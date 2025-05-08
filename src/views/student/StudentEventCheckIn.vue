<script setup>
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { userStore } from "../../stores/userStore";
import { storeToRefs } from "pinia";
import EventServices from "../../services/eventServices.js";
import EventCard from "../../components/cards/EventCard.vue";
import FlightPlanItemCard from "../../components/cards/FlightPlanItemCard.vue";
import studentServices from "../../services/studentServices.js";

const router = useRouter();
const store = userStore();
const { user } = storeToRefs(store);
const student = ref(null);
const event = ref(null);
const flightPlanItem = ref(null);
const errorMessage = ref("");
const showDialog = ref(false);
const isSuccess = ref(false);

const props = defineProps({
  eventToken: {
    type: Number,
    required: true,
  },
});

const userInitials = computed(() => {
  if (!user?.value?.fName || !user?.value?.lName) return "";
  return `${user.value.fName[0]}${user.value.lName[0]}`;
});

const getEvent = async () => {
  try {
    const response = await EventServices.getEventByToken(props.eventToken);
    event.value = response.data;

    EventServices.getFulfillableFlightPlanItems(event.value.id, 3).then(
      (response) => {
        flightPlanItem.value = response.data.fulfillableFlightPlanItems[0];
      },
    );
  } catch {
    errorMessage.value =
      "There was an issue retrieving the event data! Check-in for this event may have expired";
  }
};

const getStudent = async () => {
  const response = await studentServices.getStudentForUserId(user.value.userId);
  student.value = response.data;
};

const checkIn = async () => {
  try {
    await EventServices.checkInWithToken(
      event.value.id,
      student.value.id,
      props.eventToken,
    );
    // Handle successful check-in
    errorMessage.value = ""; // Clear any previous error message
    isSuccess.value = true;
    showDialog.value = true;
  } catch (error) {
    if (error.response && error.response.status === 500) {
      // Handle case where student is already checked in
      errorMessage.value = "You have already checked in for this event.";
    } else {
      // Handle other errors
      errorMessage.value =
        "An error occurred while checking in. Please try again.";
    }
    isSuccess.value = false;
    showDialog.value = true;
  }
};

const goToFlightPlan = () => {
  router.push({ name: "student-flightPlan" });
};

onMounted(() => {
  getEvent();
  getStudent();
});
</script>
<template>
  <v-card v-if="event" color="backgroundDarken rounded-xl w-75 mx-auto mt-8">
    <v-card-title class="text-center text-h4">Event Check-In</v-card-title>
    <v-card-text>
      <v-row justify="center" align="center" no-gutters>
        <v-col cols="12" md="5" class="d-flex justify-center">
          <div class="dashed-outline sub-card">
            <EventCard :event="event" view-only />
          </div>
        </v-col>
        <v-col class="d-flex justify-center align-center">
          <v-card-text class="text-center text-h5">
            Event Fulfills:
          </v-card-text>
          <v-icon>mdi-arrow-right</v-icon>
        </v-col>
        <v-col cols="12" md="5" class="d-flex justify-center">
          <div class="dashed-outline sub-card">
            <FlightPlanItemCard
              v-if="flightPlanItem"
              :flight-plan-item="flightPlanItem"
            />
            <div v-else class="text-center text-h6 pa-4">
              No Associated Flight Plan Item Found
            </div>
          </div>
        </v-col>
      </v-row>
      <v-row
        class="align-center justify-center mt-8 mx-auto"
        no-gutters
        style="max-width: 400px"
      >
        <v-avatar color="primary" size="64" class="mr-4"
          ><span class="text-h6">{{ userInitials }}</span></v-avatar
        >
        <v-col cols="auto" class="align-start">
          <v-card-text class="text-h5"
            >{{ user?.fName }} {{ user?.lName }}</v-card-text
          >
          <v-card-text class="text-subtitle-1 mt-n6">{{
            user?.studentId
          }}</v-card-text>
        </v-col>
      </v-row>
      <v-row class="mt-10" justify="center" align="center" no-gutters>
        <v-btn class="rounded-lg mr-6" variant="outlined">Cancel</v-btn>
        <v-btn class="rounded-lg" color="primary" @click="checkIn"
          >Check-In</v-btn
        >
      </v-row>
    </v-card-text>
  </v-card>

  <v-card v-else class="w-50 mx-auto mt-8" color="backgroundDarken">
    <v-col class="d-flex flex-column justify-center">
      <v-card-text class="text-center text-h5">
        {{ errorMessage }}
      </v-card-text>
      <v-btn
        color="danger"
        class="rounded-lg w-25 mx-auto"
        @click="goToFlightPlan"
      >
        Back to Flight Plan
      </v-btn>
    </v-col>
  </v-card>

  <v-dialog v-model="showDialog" max-width="500">
    <v-card class="rounded-lg" color="backgroundDarken">
      <v-card-title
        class="text-center text-h4"
        :class="{ 'text-danger': !isSuccess }"
      >
        {{ isSuccess ? "Success!" : "Oops!" }}
      </v-card-title>
      <v-card-text class="text-center text-h6">
        {{
          isSuccess
            ? "You have been successfully checked in for this event."
            : errorMessage
        }}
      </v-card-text>
      <v-card-actions class="justify-center pb-6">
        <v-btn
          :color="isSuccess ? 'primary' : 'danger'"
          class="rounded-lg"
          @click="goToFlightPlan"
        >
          Back to Flight Plan
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.dashed-outline {
  border: 3px;
  border-style: dashed;
  border-radius: 25px;
  height: fit-content;
  min-width: 300px;
}

.sub-card {
  width: 30%;
}

.fit-content {
  width: fit-content;
}
</style>
