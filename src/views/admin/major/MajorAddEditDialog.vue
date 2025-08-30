<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { required } from "../../../utils/formValidators";
import majorServices from "../../../services/majorServices";

// Props for dialog control and major ID
const props = defineProps({
  modelValue: Boolean, // Controls dialog visibility
  isAdd: Boolean, // True for add, false for edit
  majorId: Number, // ID of the major being edited
});

const emit = defineEmits(["update:modelValue", "saved"]);

// v-model proxy for dialog
const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const form = ref(null);
const formData = ref({});
const errorMessage = ref("");

const handleCancel = () => {
  dialog.value = false;
};

const handleSubmit = async () => {
  const isValid = (await form.value?.validate())?.valid;
  if (!isValid) return;

  errorMessage.value = ""; // Clear any previous error message

  try {
    if (props.isAdd) {
      await majorServices.createMajor(formData.value);
    } else {
      await majorServices.updateMajor(props.majorId, formData.value);
    }
    emit("saved");
    dialog.value = false;
  } catch (error) {
    console.error("Error saving major:", error);
    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while saving the major";
  }
};

const fetchData = async () => {
  if (!props.isAdd) {
    try {
      formData.value = (await majorServices.getMajor(props.majorId)).data;
    } catch (error) {
      console.error("Error fetching major:", error);
      errorMessage.value = "Error fetching major details";
    }
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) fetchData();
  },
);

onMounted(() => {
  if (props.modelValue) fetchData();
});
</script>

<template>
  <v-dialog v-model="dialog" max-width="1000">
    <h1 class="text-center ma-5">
      {{ props.isAdd ? "Add Major" : "Edit Major" }}
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
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-row class="justify-center mb-1">
          <v-btn
            class="mr-2"
            variant="outlined"
            rounded="xl"
            @click="handleCancel"
            >Cancel</v-btn
          >
          <v-btn rounded="xl" color="primary" @click="handleSubmit">Submit</v-btn>
        </v-row>
      </v-container>
    </v-form>
  </v-dialog>
</template>
