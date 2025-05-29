<script setup>
import { computed, watch, onMounted, ref } from "vue";
import QRCodeGenerationModal from "../../components/modals/QRCodeGenerationModal.vue";
import { useEventCheckIn } from "../../utils/useEventCheckin";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const props = defineProps({
  modelValue: Boolean,
  event: {
    type: Object,
    default: () => ({}),
  },
  isAdmin: Boolean,
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

const emit = defineEmits([
  "update:modelValue",
  "record-attendance",
  "generate-qr",
  "register",
  "unregister",
]);

// Composable for shared event logic
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
  successMessage,
  isEventInFuture,
  checkIfStudentIsRegistered,
  registered,
} = useEventCheckIn();

const showQRCodeModal = ref(false);

// Sync dialog visibility with parent
const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// Local event-specific actions
const recordAttendance = () => {
  emit("record-attendance", props.event);
  showSuccess("Attendance recorded!");
};
const register = async () => {
  await showSuccess("Successfully registered!");
  emit("register", props.event); // emit after message
};

const unregister = async () => {
  await showSuccess("Unregistered successfully!");
  emit("unregister", props.event); // emit after message
};

const formatDateForGoogleCalendar = (date) =>
  dayjs(date).tz("America/Chicago").format("YYYYMMDDTHHmmss");

const addToGoogleCalendar = () => {
  const title = encodeURIComponent(props.event.name);
  const details = encodeURIComponent(props.event.description || "");
  const location = encodeURIComponent(props.event.location || "");

  const start = formatDateForGoogleCalendar(props.event.startTime);
  const end = formatDateForGoogleCalendar(props.event.endTime);
  const timezone = encodeURIComponent("America/Chicago");

  const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}&ctz=${timezone}`;
  window.open(url, "_blank");
};

const addToOutlookCalendar = () => {
  const title = encodeURIComponent(props.event.name);
  const body = encodeURIComponent(props.event.description || "");
  const location = encodeURIComponent(props.event.location || "");

  const start = new Date(props.event.startTime).toISOString();
  const end = new Date(props.event.endTime).toISOString();

  const url = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&body=${body}&startdt=${start}&enddt=${end}&location=${location}`;
  window.open(url, "_blank");
};

const downloadICS = () => {
  const title = props.event.name;
  const description = props.event.description || "";
  const location = props.event.location || "";

  const dtStart =
    new Date(props.event.startTime)
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0] + "Z";
  const dtEnd =
    new Date(props.event.endTime)
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0] + "Z";

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
DTSTART:${dtStart}
DTEND:${dtEnd}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const showSuccess = async (msg) => {
  successMessage.value = msg;

  await new Promise((resolve) =>
    setTimeout(() => {
      successMessage.value = "";
      resolve();
    }, 2000),
  );

  await checkIfStudentIsRegistered();
};

// Watch for event prop changes
watch(
  () => props.event,
  async (newEvent) => {
    setEvent(newEvent);
    await getCurrentToken();
    await checkIfStudentIsRegistered();
  },
  { immediate: true },
);

// Initial mount
onMounted(() => {
  setEvent(props.event);
  getCurrentToken();
});
</script>

<template>
  <v-dialog v-model="internalValue" max-width="500px">
    <v-card color="backgroundDarken" class="rounded-xl pa-4">
      <v-card-title
        class="text-h6 text-center justify-center d-flex align-center"
      >
        <span class="flex-grow-1 text-center">{{ event.name }}</span>
        <v-icon class="cursor-pointer" @click="internalValue = false"
          >mdi-close</v-icon
        >
      </v-card-title>

      <v-card-text>
        <p>{{ event.description }}</p>
        <br />
        <p><strong>Attendance:</strong> {{ event.attendanceType }}</p>
        <p><strong>Registration:</strong> {{ event.registration }}</p>
        <p>
          <strong> Location: </strong>
          {{ props.event.location || "No Location" }}
        </p>
        <p>
          <strong> Date: </strong>
          {{ eventDate }}
          {{ eventTime }}
        </p>

        <v-fade-transition mode="out-in">
          <div v-if="successMessage">
            <v-alert type="success" variant="tonal" class="mt-4 text-center">
              {{ successMessage }}
            </v-alert>
          </div>
          <div v-else>
            <template v-if="props.isAdmin">
              <v-btn
                color="primary"
                rounded="xl"
                class="button-full"
                @click="recordAttendance"
              >
                Record Attendance
              </v-btn>
              <v-btn
                v-if="generatedToken?.token"
                color="primary"
                rounded="xl"
                class="button-full"
                :loading="generatingPDF"
                @click="downloadQRCode"
              >
                Download QR Code PDF
              </v-btn>
              <v-btn
                v-if="!generatedToken?.token && isEventInFuture && event.status !== 'Cancelled'"
                color="primary"
                rounded="xl"
                class="button-full"
                :loading="generatingToken"
                :disabled="checkingToken"
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

            <template v-else-if="!registered && event.status !== 'Cancelled'">
              <v-btn
                color="primary mt-5"
                rounded="xl"
                block
                prepend-icon="mdi-account-check"
                @click="register"
              >
                Register
              </v-btn>
            </template>

            <template v-else-if="event.status !== 'Cancelled'">
              <div class="button-row mt-5">
                <v-btn
                  color="danger"
                  rounded="xl"
                  class="button-full"
                  prepend-icon="mdi-account-off"
                  @click="unregister"
                >
                  Unregister
                </v-btn>
              </div>
            </template>

            <template v-else>
              <v-btn
                color="grey"
                rounded="xl"
                class="button-full"
                prepend-icon="mdi-cancel"
                disabled
              >
                Event Cancelled
              </v-btn>
              </template>

            <v-menu v-if="props.isAdmin || registered">
              <template #activator="{ props: menuProps }">
                <v-btn
                  v-bind="menuProps"
                  color="primary"
                  rounded="xl"
                  class="button-full"
                  prepend-icon="mdi-calendar-month"
                >
                  Add to Calendar
                </v-btn>
              </template>

              <v-list color="backgroundDarken">
                <v-list-item @click="addToGoogleCalendar">
                  <v-list-item-title>Google Calendar</v-list-item-title>
                </v-list-item>
                <v-list-item @click="addToOutlookCalendar">
                  <v-list-item-title>Outlook Calendar</v-list-item-title>
                </v-list-item>
                <v-list-item @click="downloadICS">
                  <v-list-item-title>Download ICS File</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </v-fade-transition>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.mt-5 {
  margin-top: 20px;
}

.button-full {
  width: 100%;
  margin-top: 3%;
}
</style>
