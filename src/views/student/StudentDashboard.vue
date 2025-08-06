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
import StudentApprovalDialog from "../../components/dialogs/StudentApprovalDialog.vue";
import { studentApprovalDialogStore } from "../../stores/studentApprovalDialogStore";
import ViewSubmissionDialog from "../../components/dialogs/ViewSubmissionDialog.vue";
import { studentViewSubmissionDialogStore }from "../../stores/studentViewSubmissionDialogStore";

import flightPlanItemServices from "../../services/flightPlanItemServices";
import experienceServices from "../../services/experienceServices";
import SelectEventExperience from "../../components/dialogs/SelectEventExperience.vue";
import { viewSelectEventExperienceStore } from "../../stores/viewSelectEventExperienceStore";
import { createOptionalFlightPlanExperience } from "../../utils/flightPlanExperienceItemHelper";


import EventRegistrationConfirmation from "../../components/dialogs/EventRegistrationConfirmation.vue";
import { eventRegistrationConfirmationStore } from "../../stores/eventRegistrationConfirmationStore";

import { sortFlightPlanItems } from "../../utils/flightPlanSorterHelper";



const studentId = ref(null);
const student = ref(null);
const registeredEvents = ref([]);
const checkedInEvents = ref([]);
const cancelledEvents = ref([]);
const selectedEvent = ref({});
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
const dialogFlightPlanItems = ref([]);
const events = ref([]);
const isLoaded = ref(false);
const registrationUpdateMessage = ref("")
const router = useRouter();

const useStudentApprovalDialogStore = studentApprovalDialogStore();
const useStudentViewSubmissionDialogStore = studentViewSubmissionDialogStore();

const viewSelectExperienceStore = viewSelectEventExperienceStore();

const useEventRegistrationConfirmationStore = eventRegistrationConfirmationStore();


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
    student.value = studentResponse.data;
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
        semestersFromGrad: flightPlan.semestersFromGrad,
      };
    });

    flightPlans.value.sort(
    (a, b) =>
      (a.semestersFromGrad ?? Infinity) - (b.semestersFromGrad ?? Infinity),
    );

    if (flightPlans.value.length > 0) {
      selectedFlightPlan.value = flightPlans.value[0];
      flightPlanItems.value = response.data[0].flightPlanItems.filter(
        (item) => item.status !== "Complete",
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
        (item) => item.status !== "Complete",
      );
      flightPlanItems.value = await sortFlightPlanItems(flightPlanItems.value);
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

const handleIncompleteButtonClick = (flightPlanItem) => {
  useStudentApprovalDialogStore.toggleVisibility();
  useStudentApprovalDialogStore.setFlightPlanItem(flightPlanItem);
};

const handlePendingButtonClick = (flightPlanItem) => {
  useStudentViewSubmissionDialogStore.setFlightPlanItem(flightPlanItem);
  useStudentViewSubmissionDialogStore.toggleVisibility();
};

const fetchFlightPlanAndItems = async () => {
    const params = {
    page: 1,
    pageSize: 1,
    searchQuery: "",
    filters: null,
  };
  const response =
    await flightPlanItemServices.getAllFlightPlanItemsForFlightPlan(
      selectedFlightPlan.value.value,
      params
    );
  flightPlanItems.value = response.data.flightPlanItems;
  
  const pointsResponse = await studentServices.getPoints(studentId.value);
  points.value = pointsResponse.data.points;
  await fetchFlightPlanProgress()
};

const showFlightPlanItem = ref(false);
const flightPlanItemToShow = ref({});

const handleShow = (flightPlanItem) => {
  flightPlanItemToShow.value = flightPlanItem;
  showFlightPlanItem.value = true;
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
    registrationUpdateMessage.value = "Successfully registered for the event! You will receive email notifications as the event approaches"
    useEventRegistrationConfirmationStore.toggleVisibility(true);
    useEventRegistrationConfirmationStore.toggleRegistration(true);
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
    dialogFlightPlanItems.value = (
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

    if (dialogFlightPlanItems.value.length === 0) {
      const optionalFlightPlanItem = await createOptionalFlightPlanExperience(
        event,
        eventExperiences[0],
        currentFlightPlan,
      );
      handleRegisterEventExperience(event, optionalFlightPlanItem);
    } else if (dialogFlightPlanItems.value.length == 1) {
      handleRegisterEventExperience(event, dialogFlightPlanItems.value[0]);
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
    registrationUpdateMessage.value = "Successfully unregistered from the event"
    useEventRegistrationConfirmationStore.toggleVisibility(true);
    useEventRegistrationConfirmationStore.toggleRegistration(false);
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
    dialogFlightPlanItems.value = (
      await flightPlanItemServices.getAllFlightPlanItemsForFlightPlan(
        currentFlightPlan.id,
        { page: 1, pageSize: 1000 },
      )
    ).data.flightPlanItems.filter((item) => item.eventId === event.id);
    handleUnregisterEventExperience(event, dialogFlightPlanItems.value);
  } else {
    handleUnregisterEventExperience(event);
  }
};

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
    <h1 class="mt-1">Welcome, {{ store.user ? store.user.fullName : 'Student' }}!</h1>
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
          :is-admin="false"
          :is-flight-plan-view="false"
          :flight-plan-items="flightPlanItems"
          @incomplete="handleIncompleteButtonClick"
          @register="handleRegister"
          @view="handlePendingButtonClick"
          @click="handleShow"
        ></FlightPlanItemCard>
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
            :view-only="true"
            :no-actions="true"
            :register-only="true"
            :status="
              getEventCardColor(
                event,
                checkedInEvents,
                registeredEvents,
                cancelledEvents,
              )
            "
            :event="event"
            @register="handleRegister(event)"
            @unregister="handleUnregister(event)"
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

  <StudentApprovalDialog
    @submit="fetchFlightPlanAndItems"
  ></StudentApprovalDialog>
  <ViewSubmissionDialog
    @discard="fetchFlightPlanAndItems"
  ></ViewSubmissionDialog>

  <SelectEventExperience
    :event="selectedEvent"
    :flight-plan-items="dialogFlightPlanItems"
    @register="handleRegisterEventExperience"

  <EventRegistrationConfirmation
    v-model="useEventRegistrationConfirmationStore.visible"
    :message="registrationUpdateMessage"

  />
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
