<script setup>
import { onMounted, ref, watch, computed } from "vue";
import { useRoute } from "vue-router";
import CardHeader from "../components/CardHeader.vue";
import CardTable from "../components/CardTable.vue";
import flightPlanServices from "../services/flightPlanServices";
import flightPlanItemServices from "../services/flightPlanItemServices";
import FlightPlanItemCard from "../components/cards/FlightPlanItemCard.vue";
import { useDisplay } from "vuetify";
import { userStore } from "../stores/userStore";
import { storeToRefs } from "pinia";
import studentServices from "../services/studentServices";
import StudentApprovalDialog from "../components/dialogs/StudentApprovalDialog.vue";
import { studentApprovalDialogStore } from "../stores/studentApprovalDialogStore";
import ViewSubmissionDialog from "../components/dialogs/ViewSubmissionDialog.vue";
import { studentViewSubmissionDialogStore } from "../stores/studentViewSubmissionDialogStore";
import userServices from "../services/userServices";
import { useFlightPlanStore } from "../stores/flightPlanStore";
import badgeServices from "../services/badgeServices";
import ViewBadgeAwards from "../components/dialogs/ViewBadgeAwards.vue";
import { viewBadgeAwardsStore } from "../stores/viewBadgeAwardsStore";
import { addFlightPlanItemToFlightPlanStore } from "../stores/addFlightPlanItemToFlightPlanStore";
import AddFlightPlanItemToFlightPlan from "../components/dialogs/AddFlightPlanItemToFlightPlan.vue";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import eventServices from "../services/eventServices";

const props = defineProps({
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

dayjs.extend(utc);
dayjs.extend(timezone);

const downloadFlightPlanICS = async () => {
  const eventRes = await eventServices.getAllEvents(1, 1000);
  const allEvents = eventRes.data.events;
  const eventMap = Object.fromEntries(allEvents.map((e) => [e.id, e]));

  // 🔥 Get all items in the current flight plan, not just paginated ones
  const allFPIRes =
    await flightPlanItemServices.getAllFlightPlanItemsForFlightPlan(
      selectedFlightPlan.value.value,
      { page: 1, pageSize: 1000 }, // or whatever upper bound fits your data
    );
  const allItems = allFPIRes.data.flightPlanItems;

  const registeredItems = allItems.filter(
    (item) => item.eventId && item.status === "Registered",
  );

  let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\n`;

  registeredItems.forEach((item) => {
    const event = eventMap[item.eventId];
    if (!event || !event.startTime || !event.endTime) return;

    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    const dtStart =
      start.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dtEnd = end.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    icsContent += `BEGIN:VEVENT\nSUMMARY:${event.name}\nDESCRIPTION:${
      event.description || ""
    }\nLOCATION:${event.location || ""}\nDTSTART:${dtStart}\nDTEND:${dtEnd}\nEND:VEVENT\n`;
  });

  icsContent += `END:VCALENDAR`;

  const blob = new Blob([icsContent], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "FlightPlan.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

let student = null;

const route = useRoute();
const flightPlan = ref(null);
const selectedFlightPlan = ref(null);
const flightPlans = ref([]);
const flightPlanItems = ref([]);
const page = ref(1);
const searchQuery = ref("");
const count = ref(0);
const progress = ref(0);
const flightPlanItemTypes = ref([]);
const flightPlanItemStatuses = ref([]);
const points = ref(0);
const userName = ref(null);
const unviewedBadges = ref([]);

const useAddFlightPlanItemToFlightPlanStore =
  addFlightPlanItemToFlightPlanStore();
const useStudentApprovalDialogStore = studentApprovalDialogStore();
const useStudentViewSubmissionDialogStore = studentViewSubmissionDialogStore();
const useUserStore = userStore();

const badgeAwardsStore = viewBadgeAwardsStore();

const { user } = storeToRefs(useUserStore);

const showFilters = ref(false);
const filters = ref({
  status: null,
  flightPlanItemType: null,
});

const display = useDisplay();

const numCardColumns = computed(() => {
  if (display.xxl.value) return 4;
  if (display.xl.value) return 3;
  if (display.lg.value) return 3;
  if (display.md.value) return showFilters.value ? 1 : 2;
  if (display.sm.value) return 1;
  return 1; // Default for xs
});
const pageSize = computed(() => numCardColumns.value * 2);

const flightPlanStore = useFlightPlanStore();
const selectedItem = computed(() => flightPlanStore.activeFlightPlanItem);

const fetchStudent = async () => {
  let studentResponse;

  if (props.isAdmin) {
    studentResponse = await studentServices.getStudent(route.params.id);
    const userResponse = await userServices.getOneUser(
      studentResponse.data.userId,
    );
    userName.value = userResponse.data.fullName;
  } else {
    studentResponse = await studentServices.getStudentForUserId(
      user.value.userId,
    );
  }

  student = studentResponse.data;
  const pointsResponse = await studentServices.getPoints(student.id);
  points.value = pointsResponse.data.points;
};

const fetchFlightPlan = async () => {
  const formatFlightPlanLabel = (flightPlan) => {
    if (!flightPlan.semester) {
      return "Unknown Semester";
    }
    const term =
      flightPlan.semester?.term?.charAt(0).toUpperCase() +
      flightPlan.semester?.term?.slice(1);
    return `${term} ${flightPlan.semester?.year}`;
  };

  const response = await flightPlanServices.getFlightPlanForStudent(student.id);

  flightPlans.value = response.data.map((flightPlan) => ({
    label: formatFlightPlanLabel(flightPlan),
    value: flightPlan.id,
  }));

  // Use stored semester if available, otherwise use first one
  if (flightPlanStore.selectedSemester) {
    selectedFlightPlan.value = flightPlanStore.selectedSemester;
    flightPlan.value = response.data.find(
      (plan) => plan.id === flightPlanStore.selectedSemester.value,
    );
  } else {
    selectedFlightPlan.value = flightPlans.value[0];
    flightPlan.value = response.data[0];
  }
};

const fetchFlightPlanAndItems = async () => {
  const params = {
    page: page.value,
    pageSize: pageSize.value,
    searchQuery: searchQuery.value,
    filters: filters.value,
  };

  const response =
    await flightPlanItemServices.getAllFlightPlanItemsForFlightPlan(
      selectedFlightPlan.value.value,
      params,
    );
  flightPlanItems.value = response.data.flightPlanItems.filter(
    (item) =>
      item.flightPlanItemType !== "Task" ||
      (item.task && item.task.status === "active"),
  );
  count.value = response.data.count;
};

const fetchFlightPlanProgress = async () => {
  const response = await flightPlanServices.getFlightPlanProgressForFlightPlan(
    selectedFlightPlan.value.value,
  );
  progress.value = response.data.progress;
};

const fetchFlightPlanItemTypes = async () => {
  const response = await flightPlanItemServices.getFlightPlanItemTypes();
  flightPlanItemTypes.value = response.data;
};

const fetchFlightPlanItemStatuses = async () => {
  const response = await flightPlanItemServices.getFlightPlanItemStatuses();
  flightPlanItemStatuses.value = response.data;
};

const fetchUnviewedBadges = async () => {
  const response = await badgeServices.getUnviewedBadges(student.id);
  if (response.data.length > 0 && !props.isAdmin) {
    unviewedBadges.value = response.data;
    badgeAwardsStore.toggleVisibility();
  }
};

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1; // Reset to first page on search change
};

const handleAdd = () => {
  useAddFlightPlanItemToFlightPlanStore.toggleVisibility();
};

const handleRegister = () => {
  page.value = 1;
  fetchStudent();
  fetchFlightPlan();
  fetchFlightPlanAndItems();
  fetchFlightPlanProgress();
  fetchFlightPlanItemStatuses();
  fetchFlightPlanItemTypes();
  fetchUnviewedBadges();
};

const handleChangeFilters = () => {
  fetchFlightPlanAndItems();
};

const handleClearFilters = () => {
  filters.value = {
    status: null,
    flightPlanItemType: null,
  };
  fetchFlightPlanAndItems();
};

const handleIncompleteButtonClick = (flightPlanItem) => {
  useStudentApprovalDialogStore.toggleVisibility();
  useStudentApprovalDialogStore.setFlightPlanItem(flightPlanItem);
};

const handlePendingButtonClick = (flightPlanItem) => {
  useStudentViewSubmissionDialogStore.setFlightPlanItem(flightPlanItem);
  useStudentViewSubmissionDialogStore.toggleVisibility();
};

const handleAddItems = () => {
  fetchFlightPlanAndItems();
};

const handleDelete = async (flightPlanItem) => {
  await flightPlanItemServices.deleteFlightPlanItem(flightPlanItem.id);
  await fetchFlightPlanAndItems();
};

onMounted(async () => {
  if (selectedItem.value) {
    // Scroll to the selected item
    const element = document.getElementById(`item-${selectedItem.value.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  await fetchStudent();
  await fetchFlightPlan();
  if (selectedFlightPlan.value) {
    await Promise.all([
      fetchFlightPlanAndItems(),
      fetchFlightPlanProgress(),
      fetchFlightPlanItemStatuses(),
      fetchFlightPlanItemTypes(),
      fetchUnviewedBadges(),
    ]);
  }
});

watch(selectedFlightPlan, () => {
  if (selectedFlightPlan.value) {
    fetchFlightPlanAndItems();
    fetchFlightPlanProgress();
  }
});

const hasRegisteredEvents = computed(() =>
  flightPlanItems.value.some(
    (item) => item.eventId && item.status === "Registered",
  ),
);

watch([page, searchQuery], fetchFlightPlanAndItems);
</script>
<template>
  <v-container fluid>
    <div v-if="props.isAdmin">
      <div class="mt-2 d-flex justify-center">
        <div class="mr-4 mb-5 text-h5">{{ userName }}</div>
      </div>
      <v-row v-if="flightPlans.length > 0">
        <v-col :cols="6" class="d-flex justify-end">
          <v-select
            v-model="selectedFlightPlan"
            :items="flightPlans"
            :item-title="(item) => item.label"
            :item-value="(item) => item.value"
            variant="solo"
            bg-color="background"
            return-object
            flat
            class="flex-grow-0"
            density="comfortable"
          ></v-select
        ></v-col>
        <v-col :cols="6" class="d-flex justify-start align-center mb-6">
          <span class="text-subtitle-1"> Available Points: {{ points }} </span>
        </v-col>
      </v-row>
      <p v-else class="text-h6 text-center">No flight plans found</p>
    </div>
    <div v-else>
      <div class="mt-2 d-flex justify-center">
        <v-select
          v-model="selectedFlightPlan"
          :items="flightPlans"
          :item-title="(item) => item.label"
          :item-value="(item) => item.value"
          variant="solo"
          bg-color="background"
          return-object
          class="flex-grow-0"
          density="comfortable"
          flat
        ></v-select>
      </div>
      <div class="mt-2 d-flex align-center">
        <span class="flex-grow-1 text-center text-subtitle-1">
          Available Points: {{ points }}
        </span>
      </div>
    </div>

    <v-container>
      <v-progress-linear
        v-model="progress"
        color="primary"
        bg-color="backgroundLighten"
        height="20"
        rounded
      >
        <strong>{{ progress }}%</strong></v-progress-linear
      >
    </v-container>
    <CardHeader
      :export-calendar-button="hasRegisteredEvents"
      :add-button="selectedFlightPlan == flightPlans[0] ? true : false"
      @add="handleAdd"
      @changed="handleSearchChange"
      @toggle-filters="showFilters = !showFilters"
      @export-ics="downloadFlightPlanICS"
    ></CardHeader>
    <CardTable
      :items="flightPlanItems"
      :per-row-lg="3"
      :per-row-md="2"
      :per-row-sm="1"
      :show-filters="showFilters"
      @update-filters="handleChangeFilters"
      @clear-filters="handleClearFilters"
      @close-filter-menu="showFilters = false"
    >
      <template #item="{ item }">
        <FlightPlanItemCard
          :key="item.id"
          :flight-plan-item="item"
          :is-admin="props.isAdmin"
          :is-flight-plan-view="props.isAdmin"
          :flight-plan-items="flightPlanItems"
          @incomplete="handleIncompleteButtonClick"
          @register="handleRegister"
          @view="handlePendingButtonClick"
          @delete="handleDelete"
        ></FlightPlanItemCard>
      </template>
      <template #filters>
        <v-select
          v-model="filters.flightPlanItemType"
          :items="flightPlanItemTypes"
          label="Type"
        ></v-select>
        <v-select
          v-model="filters.status"
          :items="flightPlanItemStatuses"
          label="Status"
        ></v-select>
      </template>

      <template #pagination>
        <v-pagination
          v-model="page"
          :length="count"
          :total-visible="$vuetify.display.smAndDown ? 3 : 5"
          class="mt-2"
          @next="fetchFlightPlanAndItems"
          @prev="fetchFlightPlanAndItems"
          @update:model-value="fetchFlightPlanAndItems"
        >
        </v-pagination>
      </template>
    </CardTable>
  </v-container>
  <StudentApprovalDialog
    @submit="fetchFlightPlanAndItems"
  ></StudentApprovalDialog>
  <ViewSubmissionDialog
    @discard="fetchFlightPlanAndItems"
  ></ViewSubmissionDialog>
  <ViewBadgeAwards :badges="unviewedBadges" />
  <AddFlightPlanItemToFlightPlan
    v-if="flightPlan"
    :student-id="student.id"
    @add-items="handleAddItems"
  />
</template>
