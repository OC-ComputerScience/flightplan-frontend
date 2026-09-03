<script setup>
import { ref, computed, watch } from "vue";
import { required } from "../../../utils/formValidators";
import semesterServices from "../../../services/semesterServices";
import DatePickerFieldForModal from "../../../components/DatePickerFieldForModal.vue";

const props = defineProps({
  modelValue: Boolean,
  isAdd: Boolean,
  semesterId: Number,
});

const emit = defineEmits(["update:modelValue", "saved"]);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const form = ref(null);
const formData = ref({
  term: null,
  year: "",
  startDate: null,
  endDate: null,
});
const errorMessage = ref("");
const isSaving = ref(false);

const termOptions = [
  { title: "Fall", value: "fall" },
  { title: "Winter", value: "winter" },
  { title: "Spring", value: "spring" },
  { title: "Summer", value: "summer" },
];

const yearRule = (value) =>
  /^\d{4}$/.test(String(value || "").trim()) || "Enter a 4-digit year";

const dateRangeRule = () => {
  if (!formData.value.startDate || !formData.value.endDate) {
    return "Start date and end date are required";
  }
  if (new Date(formData.value.endDate) <= new Date(formData.value.startDate)) {
    return "End date must be after start date";
  }
  return true;
};

const resetFields = () => {
  formData.value = {
    term: null,
    year: "",
    startDate: null,
    endDate: null,
  };
  errorMessage.value = "";
};

const fetchData = async () => {
  if (props.isAdd || !props.semesterId) return;
  try {
    const semester = (await semesterServices.getSemester(props.semesterId)).data;
    formData.value = {
      term: semester.term,
      year: semester.year,
      startDate: semester.startDate,
      endDate: semester.endDate,
    };
  } catch (error) {
    console.error("Error fetching semester:", error);
    errorMessage.value = "Error fetching semester details";
  }
};

const handleCancel = () => {
  dialog.value = false;
};

const handleSubmit = async () => {
  const isValid = (await form.value?.validate())?.valid;
  const rangeMessage = dateRangeRule();
  if (!isValid || rangeMessage !== true) {
    if (rangeMessage !== true) errorMessage.value = rangeMessage;
    return;
  }

  errorMessage.value = "";
  isSaving.value = true;
  try {
    const payload = {
      term: formData.value.term,
      year: String(formData.value.year).trim(),
      startDate: formData.value.startDate,
      endDate: formData.value.endDate,
    };
    if (props.isAdd) {
      await semesterServices.createSemester(payload);
    } else {
      await semesterServices.updateSemester(props.semesterId, payload);
    }
    emit("saved");
    dialog.value = false;
  } catch (error) {
    console.error("Error saving semester:", error);
    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while saving the semester";
  } finally {
    isSaving.value = false;
  }
};

watch(
  () => props.modelValue,
  (val) => {
    resetFields();
    if (val) fetchData();
  },
);
</script>

<template>
  <v-dialog v-model="dialog" max-width="1000">
    <h1 class="text-center ma-5">
      {{ props.isAdd ? "Add Semester" : "Edit Semester" }}
    </h1>
    <v-form ref="form" @submit.prevent>
      <v-container
        class="bg-backgroundDarken rounded-t-xl"
        style="max-height: 90vh; overflow-y: auto"
      >
        <v-select
          v-model="formData.term"
          :items="termOptions"
          variant="solo"
          rounded="lg"
          label="Term"
          :rules="[required]"
        ></v-select>
        <v-text-field
          v-model="formData.year"
          variant="solo"
          rounded="lg"
          label="Year"
          :rules="[required, yearRule]"
        ></v-text-field>
        <DatePickerFieldForModal
          v-model="formData.startDate"
          label="Start Date"
        />
        <DatePickerFieldForModal
          v-model="formData.endDate"
          label="End Date"
        />
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-row class="justify-center mb-1">
          <v-btn
            class="mr-2"
            variant="outlined"
            rounded="xl"
            @click="handleCancel"
          >
            Cancel
          </v-btn>
          <v-btn
            rounded="xl"
            color="primary"
            :loading="isSaving"
            @click="handleSubmit"
          >
            Submit
          </v-btn>
        </v-row>
      </v-container>
    </v-form>
  </v-dialog>
</template>
