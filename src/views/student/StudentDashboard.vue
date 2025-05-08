<script setup>
import { onMounted, ref } from "vue";
import notificationServices from "../../services/notificationServices";
import flightPlanServices from "../../services/flightPlanServices";
import eventServices from "../../services/eventServices";
import studentServices from "../../services/studentServices";
import NotificationCard from "../../components/cards/NotificationCard.vue";
import FlightPlanItemCard from "../../components/cards/FlightPlanItemCard.vue";
import EventCard from "../../components/cards/EventCard.vue";
import { userStore } from "../../stores/userStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { useFlightPlanStore } from "../../stores/flightPlanStore";
import { useRouter } from "vue-router";

const notifications = ref([]);
const currentPage = ref(1);
const pageSize = ref(14);
const totalPages = ref(1);
const store = userStore();
const notifStore = useNotificationStore();
const flightPlanStore = useFlightPlanStore();
const progress = ref(0);
const points = ref(0);
const selectedFlightPlan = ref(null);
const flightPlans = ref([]);
const flightPlanItems = ref([]);
const events = ref([]);
const isLoaded = ref(false);
const router = useRouter();
const getNotifications = async (page = 1) => {
  try {
    const res = await notificationServices.getAllNotificationsForUser(
      store.user.userId,
      page,
      pageSize.value,
    );

    notifications.value = res.data.notifications;
    totalPages.value = Math.ceil(res.data.total / pageSize.value);
    currentPage.value = page;
  } catch (err) {
    console.error("Error fetching notifications:", err);
  }
};

const fetchStudent = async () => {
  try {
    const studentResponse = await studentServices.getStudentForUserId(
      store.user.userId,
    );
    const pointsResponse = await studentServices.getPoints(
      studentResponse.data.id,
    );
    points.value = pointsResponse.data.points;
  } catch (err) {
    console.error("Error fetching student data:", err);
  }
};

const fetchFlightPlan = async () => {
  try {
    const studentResponse = await studentServices.getStudentForUserId(
      store.user.userId,
    );
    const response = await flightPlanServices.getFlightPlanForStudent(
      studentResponse.data.id,
    );

    flightPlans.value = response.data.map((flightPlan) => {
      if (!flightPlan.semester) {
        return {
          label: "Unknown Semester",
          value: flightPlan.id,
        };
      }
      return {
        label: `${flightPlan.semester.term.charAt(0).toUpperCase() + flightPlan.semester.term.slice(1)} ${flightPlan.semester.year}`,
        value: flightPlan.id,
      };
    });

    if (flightPlans.value.length > 0) {
      selectedFlightPlan.value = flightPlans.value[0];
      flightPlanItems.value = response.data[0].flightPlanItems
        .filter((item) => item.status === "Incomplete")
        .slice(0, 3);
      await fetchFlightPlanProgress();
    }
  } catch (err) {
    console.error("Error fetching flight plan:", err);
  }
};

const fetchFlightPlanProgress = async () => {
  if (!selectedFlightPlan.value) return;

  try {
    const response =
      await flightPlanServices.getFlightPlanProgressForFlightPlan(
        selectedFlightPlan.value.value,
      );
    progress.value = response.data.progress;

    // Fetch and update flight plan items for the selected semester
    const flightPlanResponse = await flightPlanServices.getFlightPlanForStudent(
      store.user.userId,
    );
    const selectedFlightPlanData = flightPlanResponse.data.find(
      (plan) => plan.id === selectedFlightPlan.value.value,
    );
    if (selectedFlightPlanData) {
      flightPlanItems.value = selectedFlightPlanData.flightPlanItems
        .filter((item) => item.status === "Incomplete")
        .slice(0, 3);
    }

    // Store the selected semester in the flight plan store
    flightPlanStore.setSelectedSemester(selectedFlightPlan.value);
  } catch (err) {
    console.error("Error fetching flight plan progress:", err);
  }
};

const getEvents = async () => {
  await eventServices
    .getAllEvents()
    .then((res) => {
      events.value = res.data.events.slice(0, 3);
      isLoaded.value = true;
    })
    .catch((err) => console.error(err));
};

const openNotification = (x) => {
  notifStore.setActiveNotification(x);
};

const openFlightPlanItem = (item) => {
  flightPlanStore.setActiveFlightPlanItem(item);
  flightPlanStore.setSelectedSemester(selectedFlightPlan.value);
  router.push({ name: "student-flightPlan" });
};

onMounted(async () => {
  await Promise.all([
    getNotifications(),
    fetchStudent(),
    fetchFlightPlan(),
    getEvents(),
  ]);
});
</script>

<template>
  <div class="dashboard-container">
    <h1 class="mt-1">Welcome, {{ store.user.fullName }}!</h1>
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

    <div class="dashboard-grid">
      <v-card color="backgroundDarken" class="dashboard-cell">
        <strong style="font-size: 24px; text-align: center; margin-left: 10px"
          >Flight Plan</strong
        >
        <div id="flightPlanList">
          <template v-if="flightPlanItems.length > 0">
            <FlightPlanItemCard
              v-for="(item, index) in flightPlanItems"
              :key="index"
              :flight-plan-item="item"
              class="flightPlanItem"
              color="background"
              :to="{ name: 'student-flightPlan' }"
              :is-flight-plan-view="false"
              backgroundColor="background"
              @click="openFlightPlanItem(item)"
            />
          </template>
          <div v-else class="text-center pa-4">
            <span class="text-subtitle-1"
              >No Incomplete Items Found For This Semester!</span
            >
          </div>
        </div>
        <v-btn
          class="see-more-btn"
          variant="text"
          :to="{ name: 'student-flightPlan' }"
        >
          See More Flight Plan Items
        </v-btn>
      </v-card>
      <v-card color="backgroundDarken" class="dashboard-cell">
        <strong style="font-size: 24px; text-align: center; margin-left: 10px">
          Notifications
        </strong>
        <div id="notifList">
          <NotificationCard
            v-for="(item, index) in notifications.slice(0, 5)"
            :key="index"
            color="background"
            :to="{ name: 'student-notifications' }"
            :notification="item"
            class="notification"
            @click="openNotification(item.id)"
          />
        </div>
        <v-btn
          class="see-more-btn"
          variant="text"
          :to="{ name: 'student-notifications' }"
        >
          See More Notifications
        </v-btn>
      </v-card>
      <v-card color="backgroundDarken" class="dashboard-cell">
        <strong style="font-size: 24px; text-align: center; margin-left: 10px"
          >Calendar</strong
        >
        <div id="eventList">
          <EventCard
            v-for="(event, index) in events"
            :key="index"
            color="background"
            :view-only="true"
            :event="event"
            class="event"
            :to="{ name: 'student-calendar' }"
          />
        </div>
        <v-btn
          class="see-more-btn"
          variant="text"
          :to="{ name: 'student-calendar' }"
        >
          See More Events
        </v-btn>
      </v-card>
    </div>
  </div>
</template>

<style>
.dashboard-container {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  padding: 0vh 1vw;
}

.dashboard-grid {
  display: flex;
  gap: 10px;
  padding: 0 20px 0 0;
  flex: 1;
  margin-top: 10px;
}

.dashboard-cell {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  height: 62vh;
  padding: 10px 5px 5px 5px;
  border-radius: 25px;
}

.dashboard-cell:first-child {
  padding-left: 0;
}

#notifList,
#flightPlanList,
#eventList {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 10px;
  padding-right: 5px;
}

.notification {
  padding: 0px 10px 0px 10px;
  margin: 10px 5px 10px 5px;
  height: 9vh;
  width: 100%;
}

.flightPlanItem {
  margin: 0px 10px 0px 10px;
  width: 100%;
}

.event {
  margin: 10px 5px 10px 5px;
  width: 100%;
}

.see-more-btn {
  margin-top: auto;
  text-align: center;
  width: 100%;
}
</style>
