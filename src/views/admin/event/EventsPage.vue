<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import EventServices from "../../../services/eventServices.js";
import StrengthServices from "../../../services/strengthServices.js";
import EventCard from "../../../components/cards/EventCard.vue";
import EventAddEditDialog from "./EventAddEditDialog.vue";
import CardTable from "../../../components/CardTable.vue";
import CardHeader from "../../../components/CardHeader.vue";
import DatePickerField from "../../../components/DatePickerField.vue";
import SortSelect from "../../../components/SortSelect.vue";
import QRCodeGenerationModal from "../../../components/modals/QRCodeGenerationModal.vue";
import { useEventCheckIn } from "../../../utils/useEventCheckin.js";

// Constants
const label = "Events";
const router = useRouter();
const display = useDisplay();

const sortProperties = [
  { title: "Start Date", value: "startTime" },
  { title: "Name", value: "name" },
  { title: "Location", value: "location" },
];

// Reactive states
const showEventDialog = ref(false);
const isAddMode = ref(true);
const selectedEventId = ref(null);

// Pagination / filtering / search
const page = ref(1);
const searchQuery = ref("");
const count = ref(0);
const showFilters = ref(false);
const filters = ref({
  startDate: null,
  endDate: null,
  location: null,
  strengths: null,
  status: null,
  attendanceType: null,
  registrationType: null,
});
const sortOptions = ref({
  sortAttribute: sortProperties[0].value,
  sortDirection: "asc",
});
const strengths = ref([]);
const events = ref([]);
const showQRCodeModal = ref(false);
const attendanceTypes = ref([]);
const registrationTypes = ref([]);

// Info sidebar
const showInfo = ref(false);

// Composable for event check-in utilities
const {
  eventToShow,
  setEvent,
  generatedToken,
  getCurrentToken,
  generateToken: handleGenerateQRCode,
  downloadQRCode,
  generatingToken,
  generatingPDF,
  checkingToken,
  isEventInFuture,
} = useEventCheckIn();

const numCardColumns = computed(() => {
  if (display.xxl.value) return 4;
  if (display.xl.value) return showInfo.value ? 3 : 4;
  if (display.lg.value) return showFilters.value || showInfo.value ? 3 : 4;
  if (display.md.value) return showFilters.value || showInfo.value ? 2 : 3;
  if (display.sm.value) return showFilters.value || showInfo.value ? 1 : 2;
  return 1;
});

const pageSize = computed(() => numCardColumns.value * 2);

// Fetch events and strengths
const getEvents = async (pageNumber = page.value) => {
  try {
    const result = await EventServices.getAllEvents(
      pageNumber,
      pageSize.value,
      searchQuery.value,
      { ...filters.value, ...sortOptions.value },
    );
    events.value = result.data.events;
    count.value = result.data.count;
  } catch (error) {
    console.error("Error fetching events:", error);
  }
};

const getStrengths = () => {
  StrengthServices.getAllStrengths().then((response) => {
    strengths.value = response.data;
  });
};

// Handlers
const handleAdd = () => {
  isAddMode.value = true;
  selectedEventId.value = null;
  showEventDialog.value = true;
};

const handleEdit = (eventId) => {
  isAddMode.value = false;
  selectedEventId.value = eventId;
  showEventDialog.value = true;
};

const handleDialogSaved = () => {
  showEventDialog.value = false;
  getEvents();
};

const handleDelete = async (eventId) => {
  try {
    await EventServices.deleteEvent(eventId);
    await getEvents();
  } catch (error) {
    console.error("Error deleting event:", error);
  }
};

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1;
  getEvents();
};

const handleChangeFilters = () => {
  if (filters.value.strengths && filters.value.strengths.length > 0) {
    filters.value.strengths = filters.value.strengths.map(
      (strength) => strength.id,
    );
  }
  getEvents();
};

const handleClearFilters = () => {
  filters.value = {
    startDate: null,
    endDate: null,
    location: null,
    strengths: null,
    status: null,
    attendanceType: null,
    registrationType: null,
  };
  getEvents();
};

const handleShowInfo = async (eventId) => {
  const selectedEvent = events.value.find((e) => e.id === eventId);
  setEvent(selectedEvent);
  showInfo.value = true;
  await getCurrentToken();
};

const handleAttendance = (eventId, eventName) => {
  router.push({
    name: "attendanceEvent",
    params: { id: eventId, eventName },
  });
};

// Initial load
onMounted(async () => {
  try {
    const [
      eventsData,
      strengthsData,
      attendanceTypesData,
      registrationTypesData,
    ] = await Promise.all([
      getEvents(),
      getStrengths(),
      EventServices.getAttendanceTypes(),
      EventServices.getRegistrationTypes(),
    ]);

    attendanceTypes.value = attendanceTypesData.data;
    registrationTypes.value = registrationTypesData.data;
  } catch (error) {
    console.error("Error loading event data:", error);
  }
});

// Refresh events on UI changes
watch(
  filters,
  () => {
    handleChangeFilters();
  },
  { deep: true },
);
watch(showInfo, getEvents);
</script>

<template>
  <v-container fluid>
    <CardHeader
      :label="label"
      @changed="handleSearchChange"
      @add="handleAdd"
      @toggle-filters="showFilters = !showFilters"
    ></CardHeader>
    <CardTable
      :items="events"
      :per-row-lg="showFilters || showInfo ? 3 : 4"
      :per-row-md="showFilters || showInfo ? 2 : 3"
      :per-row-sm="showFilters || showInfo ? 1 : 2"
      :show-filters="showFilters"
      :show-info="showInfo"
      :info-label="eventToShow.name"
      @update-filters="handleChangeFilters"
      @close-filter-menu="showFilters = false"
      @close-info="showInfo = false"
      @clear-filters="handleClearFilters"
    >
      <template #item="{ item }">
        <EventCard
          :event="item"
          @edit="handleEdit"
          @delete="handleDelete"
          @show-info="handleShowInfo"
        ></EventCard>
      </template>
      <template #filters>
        <DatePickerField v-model="filters.startDate" label="Start Date" />
        <DatePickerField v-model="filters.endDate" label="End Date" />
        <v-select
          v-model="filters.status"
          :items="['Upcoming', 'Cancelled', 'Past']"
          label="Status"
          clearable
        ></v-select>
        <v-select
          v-model="filters.attendanceType"
          :items="attendanceTypes"
          label="Attendance Type"
          clearable
        ></v-select>
        <v-select
          v-model="filters.registrationType"
          :items="registrationTypes"
          label="Registration Type"
          clearable
        ></v-select>
        <v-combobox
          v-model="filters.strengths"
          :items="strengths"
          item-title="name"
          item-value="id"
          label="Strengths"
          multiple
          chips
          clearable
        ></v-combobox>
        <v-text-field
          v-model="filters.location"
          label="Location"
          clearable
        ></v-text-field>
        <SortSelect
          v-model="sortOptions"
          :sort-options="sortProperties"
          @update:model-value="handleChangeFilters"
        ></SortSelect>
      </template>
      <template #info>
        <br />
        <h3>{{ eventToShow.description }}</h3>
        <br />
        <h4>Attendance: {{ eventToShow.attendanceType }}</h4>
        <h4>Registration Type: {{ eventToShow.registration }}</h4>
        <v-btn
          class="mt-5 mb-0 full-width"
          rounded="xl"
          color="primary"
          block
          @click="handleAttendance(eventToShow.id, eventToShow.name)"
        >
          Record Attendance
        </v-btn>
        <br />

        <v-btn
          v-if="generatedToken?.token"
          color="primary"
          class="full-width"
          rounded="xl"
          block
          :loading="generatingPDF"
          @click="downloadQRCode"
        >
          Download QR Code PDF
        </v-btn>
        <v-btn
          v-else-if="isEventInFuture"
          color="primary"
          rounded="xl"
          class="full-width"
          :loading="generatingToken"
          :disabled="checkingToken"
          block
          @click="showQRCodeModal = true"
        >
          Generate Check-In Code
        </v-btn>

        <QRCodeGenerationModal
          v-model:show="showQRCodeModal"
          :event="eventToShow"
          @generate="handleGenerateQRCode"
        />
      </template>
      <template #pagination>
        <v-pagination
          v-model="page"
          :length="count"
          :total-visible="$vuetify.display.smAndDown ? 3 : 5"
          class="mt-4"
          @next="getEvents"
          @prev="getEvents"
          @update:model-value="getEvents"
        >
        </v-pagination>
      </template>
    </CardTable>
    
    <!-- Task Add/Edit Dialog -->
    <EventAddEditDialog
      v-model="showEventDialog"
      :is-add="isAddMode"
      :event-id="selectedEventId"
      @saved="handleDialogSaved"
    />
  </v-container>
</template>
