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
import { getEventCardColor } from "../../utils/eventStatus";
import FirstTimeInstructions from "../../components/dialogs/FirstTimeInstructions.vue";

const studentId = ref(null);
const registeredEvents = ref([]);
const checkedInEvents = ref([]);
const cancelledEvents = ref([]);
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
const allFlightPlanItems = ref([]);
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
    cancelledEvents.value = events.value.filter(
      (event) => event.status === "Cancelled",
    );
  } catch (err) {
    console.error("Error fetching student status:", err);
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
      flightPlanItems.value = response.data[0].flightPlanItems.filter(
        (item) => item.status === "Incomplete",
      );
      allFlightPlanItems.value = response.data[0].flightPlanItems;
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
      flightPlanItems.value = selectedFlightPlanData.flightPlanItems.filter(
        (item) => item.status === "Incomplete",
      );
    }

    // Store the selected semester in the flight plan store
    flightPlanStore.setSelectedSemester(selectedFlightPlan.value);
  } catch (err) {
    console.error("Error fetching flight plan progress:", err);
  }
};

const getEvents = async () => {
  const today = new Date();
  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + 7);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  await eventServices
    .getAllEvents(1, 1000, "", { startDate: yesterday, endDate: nextSaturday })
    .then((res) => {
      events.value = res.data.events
        .filter((event) => {
          if (event.status === 'Cancelled' || event.status === 'Completed' || event.status === 'Past') return false;

          const eventDate = new Date(event.date);
          if (eventDate.toDateString() === today.toDateString()) {
            const endTime = new Date(event.endTime);
            return endTime > today;
          }
          return true;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
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

// getting cookie - w3 schools
const getCookie = (cname) => {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

onMounted(async () => {
  await Promise.all([
    getNotifications(),
    fetchStudent(),
    fetchFlightPlan(),
    getEvents(),
  ]);
  await fetchStudentId();
  await fetchStudentStatus();
});
</script>

<template>
  <div v-if="getCookie('showFirstTimeInstructions') === 'true'">  <FirstTimeInstructions /></div>

  <div class="dashboard-container">
    <h1 class="mt-1">Welcome, {{ store.user.fullName }}!</h1>
    <v-row justify="center" class="mr-2">
      <v-col cols="12">
        <v-card color="backgroundDarken" style="border-radius: 25px">
          <v-card-text>
            <div class="d-flex align-center justify-start mb-4">
              <strong class="section-headers"
                >{{ selectedFlightPlan?.label }} Flight Plan</strong
              >
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props" size="20" class="ml-2"
                    >mdi-information-outline</v-icon
                  >
                </template>
                <span
                  >Overview of your flight plan completion progress for the
                  selected semester</span
                >
              </v-tooltip>
            </div>
            <div class="d-flex align-center justify-start mb-4">
              <p
                class="section-headers"
                style="font-size: 16px;"
              >
                Work hard to complete the flight plan items below so you will be well prepared to help your career soar!
              </p>
            </div>
            <strong
              >Current Flight Plan Completion Progress ({{
                allFlightPlanItems.length - flightPlanItems.length
              }}/{{ allFlightPlanItems.length }} Items Complete):
            </strong>
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
              <span class="text-h6"
                >Available Points: {{ points }}</span
              >
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div class="dashboard-grid">
      <v-card color="backgroundDarken" class="dashboard-cell">
        <div class="d-flex align-center justify-center">
          <strong class="section-headers">Flight Plan</strong>
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="20" class="ml-2"
                >mdi-information-outline</v-icon
              >
            </template>
            <span
              >Your list of incomplete tasks and experiences for the selected
              semester</span
            >
          </v-tooltip>
        </div>
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
              background-color="background"
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
        <div class="d-flex align-center justify-center">
          <strong class="section-headers">Notifications</strong>
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="20" class="ml-2"
                >mdi-information-outline</v-icon
              >
            </template>
            <span
              >Notifications regarding flight plan task and experience statuses,
              information about events you've registered for, and more</span
            >
          </v-tooltip>
        </div>
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
        <div class="d-flex align-center justify-center">
          <strong class="section-headers">Calendar</strong>
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="20" class="ml-2"
                >mdi-information-outline</v-icon
              >
            </template>
            <span>Register for upcoming events this week</span>
          </v-tooltip>
        </div>
        <div id="eventList">
          <EventCard
            v-for="(event, index) in events"
            :key="index"
            color="background"
            :view-only="true"
            :no-actions="true"
            :status="
              getEventCardColor(
                event,
                checkedInEvents,
                registeredEvents,
                cancelledEvents,
              )
            "
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

.section-headers {
  font-size: 24px;
  margin-left: 10px;
  margin-right: 10px;
}
</style>
