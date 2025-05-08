<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import EventServices from "../../services/eventServices.js";
import StrengthServices from "../../services/strengthServices.js";
import EventCard from "../../components/cards/EventCard.vue";
import CardTable from "../../components/CardTable.vue";
import CardHeader from "../../components/CardHeader.vue";
import DatePickerField from "../../components/DatePickerField.vue";
import SortSelect from "../../components/SortSelect.vue";
import QRCodeGenerationModal from "../../components/modals/QRCodeGenerationModal.vue";
import { useEventCheckIn } from "../../utils/useEventCheckin.js";

// Constants
const label = "Events";
const router = useRouter();
const display = useDisplay();

const sortProperties = [
  { title: "Start Date", value: "startTime" },
  { title: "Name", value: "name" },
  { title: "Location", value: "location" },
];

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
});
const sortOptions = ref({
  sortAttribute: sortProperties[0].value,
  sortDirection: "asc",
});
const strengths = ref([]);
const events = ref([]);
const showQRCodeModal = ref(false);

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
const handleAdd = () => router.push({ name: "addEvent" });

const handleEdit = (eventId) =>
  router.push({ name: "editEvent", params: { id: eventId } });

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
  if (filters.value.strengths?.length) {
    filters.value.strengths = filters.value.strengths.map((s) => s.id);
  }
  getEvents();
};

const handleClearFilters = () => {
  filters.value = {
    startDate: null,
    endDate: null,
    location: null,
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
onMounted(() => {
  getEvents();
  getStrengths();
});

// Refresh events on UI changes
watch(showFilters, getEvents);
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
        ></v-text-field>
        <SortSelect
          v-model="sortOptions"
          :sort-options="sortProperties"
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
  </v-container>
</template>
