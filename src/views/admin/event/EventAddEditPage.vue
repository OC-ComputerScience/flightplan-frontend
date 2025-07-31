<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import eventServices from "../../../services/eventServices";
import experienceServices from "../../../services/experienceServices";
import strengthServices from "../../../services/strengthServices";
import majorServices from "../../../services/majorServices";
import {
  validateEndTime,
  validateTime,
  formatTimeOptions,
  formatTime,
  parseTimeString,
  generateTimeOptions,
} from "../../../utils/dateTimeHelpers";
import { required } from "../../../utils/formValidators";
import DatePickerFieldForModal from "../../../components/DatePickerFieldForModal.vue";
import ConfirmDialog from "../../../components/dialogs/ConfirmDialog.vue";
import { createEventUpdateNotification, createEventCancelNotification } from "../../../utils/notificationHandler";

const props = defineProps({ isAdd: Boolean });

const form = ref(null);
const formData = ref({});
const selectedDate = ref();
const registrationTypes = ref([]);
const attendanceTypes = ref([]);
const timeOptions = ref(generateTimeOptions());
const experienceOptions = ref([]);

const isAllDay = ref(false);

const tempStartTime = ref();
const tempEndTime = ref();

const strengths = ref([]);
const initialStrengths = ref([]);
const strengthOptions = ref([]);
const majors = ref([]);
const initialMajors = ref([]);
const majorOptions = ref([]);

const route = useRoute();
const router = useRouter();

const confirmCancelDialog = ref(false);
const isCancel = ref(false);
const eventToCancel = ref(null);

const onAllDayToggle = () => {
  if (isAllDay.value) {
    tempStartTime.value = formData.value.startTime;
    tempEndTime.value = formData.value.endTime;
    formData.value.startTime = "12:00 AM";
    formData.value.endTime = "11:59 PM";
  } else {
    formData.value.startTime = tempStartTime.value;
    formData.value.endTime = tempEndTime.value;
  }
};

const handleCancel = () => router.back();

const handleCancelEvent = (eventId) => {
  eventToCancel.value = eventId;
  confirmCancelDialog.value = true;
};
const confirmCancel = async () => {
  try {
    formData.value.status = "Cancelled";
    isCancel.value = true;
    handleSubmit();
    confirmCancelDialog.value = false;
  } catch (err) {
    console.error("Error cancelling event:", err);
  }
};

const handleSubmit = async () => {
  const isValid = (await form.value?.validate())?.valid;
  if (!isValid || !selectedDate.value) return;

  const date = new Date(selectedDate.value); // Ensure it's a valid Date object
  if (isNaN(date.getTime())) {
    console.error("Invalid date selected:", selectedDate.value);
    return;
  }

  // Convert startTime and endTime to ISO format
  const startTime = parseTimeString(formData.value.startTime, date);
  const endTime = parseTimeString(formData.value.endTime, date);

  if (!startTime || !endTime) {
    console.error(
      "Invalid time values:",
      formData.value.startTime,
      formData.value.endTime,
    );
    return;
  }

  // Update formData with ISO formatted values
  formData.value.date = date.toISOString();
  formData.value.startTime = startTime.toISOString();
  formData.value.endTime = endTime.toISOString();

  try {
    if (props.isAdd) {
      const event = (await eventServices.createEvent(formData.value)).data;
      for (const strength of strengths.value) {
        await eventServices.addStrength(event.id, strength);
      }
      for (const major of majors.value) {
        await eventServices.addMajor(event.id, major);
      }
    } else {
      await eventServices.updateEvent(route.params.id, formData.value);

      const getId = (item) =>
        typeof item === "object" && item !== null ? item.id : item;

      // Adds new event strengths
      for (const strength of strengths.value) {
        const strengthId = getId(strength);
        if (!initialStrengths.value.some((s) => getId(s) === strengthId)) {
          await eventServices.addStrength(route.params.id, strengthId);
        }
      }
      // Removes deselected event strengths
      for (const strength of initialStrengths.value) {
        const strengthId = getId(strength);
        if (!strengths.value.some((s) => getId(s) === strengthId)) {
          await eventServices.removeStrength(route.params.id, strengthId);
        }
      }

      // Adds new event majors
      for (const major of majors.value) {
        const majorId = getId(major);
        if (!initialMajors.value.some((m) => getId(m) === majorId)) {
          await eventServices.addMajor(route.params.id, majorId);
        }
      }
      // Removes deselected event majors
      for (const major of initialMajors.value) {
        const majorId = getId(major);
        if (!majors.value.some((m) => getId(m) === majorId)) {
          await eventServices.removeMajor(route.params.id, majorId);
        }
      }

      if (!props.isAdd) {
        var registeredStudents = [];
        const res = await eventServices.getRegisteredStudents(route.params.id);

        if (res.data) {
          let eventData = {
            name: formData.value.name,
            description: formData.value.description,
            location: formData.value.location,
            date: new Date(formData.value.date).toLocaleDateString(),
            startTime: formatTime(new Date(formData.value.startTime)),
            endTime: formatTime(new Date(formData.value.endTime)),
          };

          if (isCancel.value) {
            res.data.forEach((student) => {
              registeredStudents.push(student.id);
              createEventCancelNotification(eventData, student.studentId, true, null, student.user.email);
            });
            isCancel.value = false;
          } else {
            res.data.forEach((student) => {
             registeredStudents.push(student.id);
              createEventUpdateNotification(
                eventData,
                student.studentId,
                true,
                null,
                student.user.email,
              );
            });
          }
        }
      }
    }
    router.back();
  } catch (error) {
    console.error("Error saving event:", error);
  }
};

onMounted(async () => {
  try {
    const [
      attendanceTypesRes,
      registrationTypesRes,
      experienceRes,
      strengthsRes,
      majorsRes,
    ] = await Promise.all([
      eventServices.getAttendanceTypes(),
      eventServices.getRegistrationTypes(),
      experienceServices.getAllExperiences(),
      strengthServices.getAllStrengths(),
      majorServices.getAllMajors(),
    ]);

    attendanceTypes.value = attendanceTypesRes.data;
    registrationTypes.value = registrationTypesRes.data;
    experienceOptions.value = experienceRes.data.experiences;

    // Fetch strengths and map them to options
    strengthOptions.value = strengthsRes.data.map((strength) => ({
      title: strength.name,
      value: strength.id,
      ...strength,
    }));

    // Fetch majors and map them to options
    majorOptions.value = majorsRes.data.majors.map((major) => ({
      title: major.name,
      value: major.id,
      ...major,
    }));

    if (props.isAdd && route.params.date) {
      selectedDate.value = new Date(route.params.date);
    }
    if (!props.isAdd) {
      formData.value = (await eventServices.getEvent(route.params.id)).data;
      formData.value.startTime = formatTime(new Date(formData.value.startTime));
      formData.value.endTime = formatTime(new Date(formData.value.endTime));
      selectedDate.value = new Date(formData.value.date);

      // Load existing strength associations
      const eventStrengths = await strengthServices.getStrengthForEvent(
        route.params.id,
      );
      strengths.value = eventStrengths.data.map((eventStrength) => ({
        title: eventStrength.name,
        value: eventStrength.id,
        ...eventStrength,
      }));
      initialStrengths.value = strengths.value;

      // Load existing majors associations
      const eventMajors = await majorServices.getMajorForEvent(route.params.id);
      majors.value = eventMajors.data.map((eventMajor) => ({
        title: eventMajor.name,
        value: eventMajor.id,
        ...eventMajor,
      }));
      initialMajors.value = majors.value;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  if (
    formData.value.startTime == "12:00 AM" &&
    formData.value.endTime == "11:59 PM"
  ) {
    isAllDay.value = true;
    onAllDayToggle();
  }
});

const filteredEndTimeOptions = computed(() => {
  if (!formData.value.startTime) return timeOptions.value;
  const start = parseTimeString(formData.value.startTime, "01/01/2000");
  return timeOptions.value.filter(
    (time) => parseTimeString(time, "01/01/2000") > start,
  );
});

const validateEndTimeWrapper = (value) => {
  return validateEndTime(value, formData.value);
};
</script>

<template>
  <h1 class="text-center ma-5">
    {{ props.isAdd ? "Add Event" : "Edit Event" }}
  </h1>
  <v-form ref="form" @submit.prevent>
    <v-container
      class="bg-backgroundDarken rounded-t-xl"
      style="max-height: 90vh; overflow-y: auto"
    >
      <v-text-field
        v-model="formData.name"
        variant="solo"
        rounded="lg"
        label="Name"
        :rules="[required]"
      ></v-text-field>
      <v-text-field
        v-model="formData.location"
        variant="solo"
        rounded="lg"
        label="Location"
      ></v-text-field>

      <v-row no-gutters>
        <v-col size="6">
          <DatePickerFieldForModal v-model="selectedDate" :rules="[required]" />
        </v-col>
      </v-row>

      <v-row v-if="selectedDate" no-gutters>
        <v-col cols="1" class="ml-4 mr-16">
          <v-checkbox
            v-model="isAllDay"
            label="All Day"
            @change="onAllDayToggle"
          />
        </v-col>
        <v-col cols="5" class="mr-2">
          <v-combobox
            v-model="formData.startTime"
            :items="timeOptions"
            label="Start Time"
            variant="solo"
            rounded="lg"
            :rules="[validateTime]"
            :disabled="isAllDay"
            @update:model-value="
              (value) => (formData.startTime = formatTimeOptions(value))
            "
          />
        </v-col>
        <v-col cols="5" class="mr-2">
          <v-combobox
            v-model="formData.endTime"
            :items="filteredEndTimeOptions"
            label="End Time"
            variant="solo"
            rounded="lg"
            :rules="[validateTime, validateEndTimeWrapper]"
            :disabled="isAllDay"
            @update:model-value="
              (value) => (formData.endTime = formatTimeOptions(value))
            "
          />
        </v-col>
      </v-row>

      <v-select
        v-model="formData.registration"
        variant="solo"
        rounded="lg"
        clearable
        label="Registration Type"
        :items="registrationTypes"
        :rules="[required]"
      />

      <v-select
        v-model="formData.attendanceType"
        variant="solo"
        rounded="lg"
        clearable
        label="Attendance Type"
        :items="attendanceTypes"
        :rules="[required]"
      />

      <v-textarea
        v-model="formData.description"
        variant="solo"
        rounded="lg"
        label="Description"
      ></v-textarea>

      <v-autocomplete
        v-model="formData.experiences"
        :items="experienceOptions"
        item-title="name"
        item-value="id"
        label="Experience"
        variant="solo"
        return-object
        multiple
        chips
      ></v-autocomplete>

      <v-row no-gutters>
        <v-autocomplete
          v-model="strengths"
          variant="solo"
          rounded="lg"
          label="Strengths"
          :items="strengthOptions"
          item-value="value"
          item-title="title"
          multiple
          chips
        ></v-autocomplete>
      </v-row>

      <v-row no-gutters>
        <v-autocomplete
          v-model="majors"
          variant="solo"
          rounded="lg"
          label="Majors"
          :items="majorOptions"
          item-value="value"
          item-title="title"
          multiple
          chips
        ></v-autocomplete>
      </v-row>

      <v-text-field
        v-model="formData.status"
        disabled
        variant="solo"
        rounded="lg"
        label="Event Status"
      />

      <v-row class="justify-center mb-1">
        <v-btn
          class="mr-2"
          variant="outlined"
          rounded="xl"
          @click="handleCancel"
          >Back</v-btn
        >
        <v-btn
          v-if="formData.status !== 'Cancelled'"
          class="mr-2"
          variant="outlined"
          rounded="xl"
          color="warning"
          @click="handleCancelEvent"
          >Cancel Event</v-btn
        >
        <v-btn
          v-if="formData.status !== 'Cancelled'"
          rounded="xl"
          color="primary"
          @click="handleSubmit"
          >Submit</v-btn
        >
      </v-row>
    </v-container>
  </v-form>

  <ConfirmDialog
    v-model="confirmCancelDialog"
    title="Cancel Event?"
    confirm-text="Yes, Cancel Event"
    cancel-text="No, Close"
    confirm-color="error"
    @confirm="confirmCancel"
  />
</template>
