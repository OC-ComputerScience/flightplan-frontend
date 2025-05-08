<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { required } from "../../../utils/formValidators";
import majorServices from "../../../services/majorServices";

const props = defineProps({ isAdd: Boolean });

const form = ref(null);
const formData = ref({});
const errorMessage = ref("");

const route = useRoute();
const router = useRouter();

const handleCancel = () => {
  router.push({ name: "majors" });
};

const handleSubmit = async () => {
  const isValid = (await form.value?.validate())?.valid;
  if (!isValid) return;

  errorMessage.value = ""; // Clear any previous error message

  try {
    if (props.isAdd) {
      await majorServices.createMajor(formData.value);
    } else {
      await majorServices.updateMajor(route.params.id, formData.value);
    }
    router.push({ name: "majors" });
  } catch (error) {
    console.error("Error saving major:", error);
    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while saving the major";
  }
};

onMounted(async () => {
  if (!props.isAdd) {
    try {
      formData.value = (await majorServices.getMajor(route.params.id)).data;
    } catch (error) {
      console.error("Error fetching major:", error);
      errorMessage.value = "Error fetching major details";
    }
  }
});
</script>

<template>
  <h1 class="text-center ma-5">
    {{ props.isAdd ? "Add Major" : "Edit Major" }}
  </h1>
  <v-form ref="form" @submit.prevent>
    <v-container class="bg-backgroundDarken rounded-t-xl">
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
</template>
