<script setup>
import { onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  required,
  positiveNumber,
  fileTypeRule,
} from "../../../utils/formValidators";
import rewardServices from "../../../services/rewardServices";
import fileServices from "../../../services/fileServices";
// Define statements for vue
const props = defineProps({
  isAdd: Boolean,
});

// Vue specific statements
const route = useRoute();
const router = useRouter();

// Reactive states
const errorMessage = ref("");
const form = ref(null);
const formData = ref({});
const image = ref(null);

// Form data
const redemptionTypes = ['In-Person', 'Digital'];

// Functions
const handleCancel = () => {
  router.push({ name: "reward" });
};

const handleSubmit = async () => {
  const isValid = (await form.value?.validate())?.valid;
  if (!isValid) return;
  try {
    if (props.isAdd) {
      await uploadImage();
      await rewardServices.createReward(formData.value);
    } else {
      await handleImageUpdate();
      await rewardServices.updateReward(route.params.id, formData.value);
    }
    router.push({ name: "reward" });
  } catch (error) {
    errorMessage.value = "An error occurred while trying to submit.";
    console.error("Error saving task:", error);
  }
};

const uploadImage = async () => {
  if (!image.value) return;
  const response = await fileServices.uploadFile({
    file: image.value,
    folder: "photos",
  });
  formData.value.imageName = response.data.fileName;
};

const handleImageUpdate = async () => {
  if (image.value && !formData.value.imageName) {
    await uploadImage();
  }
  // Case where image is changed
  else if (image.value && formData.value.imageName !== image.value.name) {
    await fileServices.deleteFileForName(formData.value.imageName);
    await uploadImage();
  }
  // Case where image is deleted
  else if (!image.value && formData.value.imageName) {
    await fileServices.deleteFileForName(formData.value.imageName);
    formData.value.imageName = null;
  }
  formData.value.image = undefined;
};

// Vue functions
onMounted(async () => {
  if (!props.isAdd) {
    try {
      let response = await rewardServices.getReward(route.params.id);
      formData.value = response.data;
      if (formData.value.imageName) {
        response = await rewardServices.getRewardImage(
          formData.value.imageName,
        );
        image.value = new File([response.data.image], formData.value.imageName);
      }
    } catch (err) {
      console.log("Error", err);
    }
  }
});
</script>
<template>
  <v-alert v-if="errorMessage" closable type="error">
    {{ errorMessage }}
  </v-alert>
  <h1 class="text-center ma-5">
    {{ props.isAdd ? "Add Reward" : "Edit Reward" }}
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
      <v-row no-gutters>
        <v-col size="6" class="mr-4">
          <v-text-field
            v-model="formData.points"
            variant="solo"
            rounded="lg"
            label="Points"
            :rules="[required, positiveNumber]"
          ></v-text-field>
        </v-col>
        <v-col size="6">
          <v-select
            v-model="formData.redemptionType"
            :items="redemptionTypes"
            variant="solo"
            rounded="lg"
            label="Redemption Type"
            :rules="[required]"
          ></v-select>
        </v-col>
      </v-row>
      <v-text-field
        v-model="formData.redemptionInfo"
        variant="solo"
        rounded="lg"
        label="Redemption Info"
        :rules="[required]"
      ></v-text-field>
      <v-textarea
        v-model="formData.description"
        variant="solo"
        rounded="lg"
        label="Description"
        :rules="[required]"
      ></v-textarea>
      <v-file-input
        v-model="image"
        variant="solo"
        rounded="lg"
        label="Image File"
        chips
        :rules="[fileTypeRule]"
      ></v-file-input>
      <v-row class="justify-center my-1">
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
