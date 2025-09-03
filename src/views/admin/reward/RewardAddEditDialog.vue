<script setup>
import { onMounted, computed, ref, watch } from "vue";
import rewardServices from "../../../services/rewardServices";
import fileServices from "../../../services/fileServices";
import ImageInput from "../../../components/modals/ImageInput.vue";
// Define statements for vue
const props = defineProps({
  modelValue: Boolean, // Controls dialog visibility
  isAdd: Boolean, // True for add, false for edit
  rewardId: Number, // ID of the event being edited
});

const emit = defineEmits(["update:modelValue", "saved"]);

// v-model proxy for dialog
const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// Reactive states
const errorMessage = ref("");
const form = ref(null);
const formData = ref({ imageName: null });
const image = ref(null);
const hasQuantity = ref(false);
const hasMaximumPerUser = ref(false);

// Form data
const redemptionTypes = ["In-Person", "Digital"];
const statusTypes = ref([]);

// Functions
const handleCancel = () => {
  dialog.value = false;
};

const handleSubmit = async () => {
  const isValid = (await form.value?.validate())?.valid;
  if (!isValid) return;

  if (!hasQuantity.value) {
    formData.value.quantityAvaliable = null;
  }

  if (!hasMaximumPerUser.value) {
    formData.value.maximumRedemptionsPerUser = null;
  }
  
  try {
    if (props.isAdd) {
      await uploadImage();
      await rewardServices.createReward(formData.value);
    } else {
      await handleImageUpdate();
      await rewardServices.updateReward(props.rewardId, formData.value);
    }
    emit("saved");
    dialog.value = false;
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

const fetchData = async () => {
  try {
    const statusRes = await rewardServices.getStatusTypes();
    statusTypes.value = statusRes.data;
  } catch (err) {
    console.error("Error fetching status types:", err);
  }

  if (!props.isAdd) {
    try {
      let response = await rewardServices.getReward(props.rewardId);
      formData.value = response.data;
      if (formData.value.imageName) {
        response = await rewardServices.getRewardImage(
          formData.value.imageName,
        );
        image.value = new File([response.data.image], formData.value.imageName);
      }
      if (formData.value.quantityAvaliable !== null) {
        hasQuantity.value = true;
      }
      if (formData.value.maximumRedemptionsPerUser !== null) {
        hasMaximumPerUser.value = true;
      }
    } catch (err) {
      console.log("Error", err);
    }
  }
};

// Vue functions
onMounted(() => {
  if (props.modelValue) fetchData();
});

const initial = ref(true);

watch(
  () => props.modelValue,
  (val) => {
    if (val) fetchData();
  },
);

watch(
  () => formData.value.redemptionType,
  (newValue) => {
    if (initial.value && !props.isAdd) {
      initial.value = false;
      return;
    }
    if (newValue === "In-Person") {
      formData.value.redemptionInfo =
        "Claim at Career Services Office (2nd Floor of the Beam Library)";
    } else {
      formData.value.redemptionInfo =
        "You will receive an email within 48 hours with confirmation of your reward";
    }
  },
);
</script>
<template>
  <v-dialog v-model="dialog" max-width="1000">
    <v-alert v-if="errorMessage" closable type="error">
      {{ errorMessage }}
    </v-alert>
    <h1 class="text-center ma-5">
      {{ props.isAdd ? "Add Reward" : "Edit Reward" }}
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
        <v-select
          v-model="formData.status"
          :items="statusTypes"
          variant="solo"
          rounded="lg"
          label="Status"
          :rules="[required]"
        ></v-select>
        <v-textarea
          v-model="formData.description"
          variant="solo"
          rounded="lg"
          label="Description"
          :rules="[required]"
        ></v-textarea>
        <v-row no-gutters>
          <v-checkbox
            v-model="hasQuantity"
            label="Limited Quantity?"
            variant="solo"
            rounded="lg"
            class="mr-4"
          ></v-checkbox>
          <v-checkbox
            v-model="hasMaximumPerUser"
            label="Maximum Quantity Per User?"
            variant="solo"
            rounded="lg"
          ></v-checkbox>
        </v-row>
        <v-text-field
          v-if="hasQuantity"
          v-model="formData.quantityAvaliable"
          variant="solo"
          rounded="lg"
          label="Quantity Available"
          :rules="[required, zeroOrGreater]"
        ></v-text-field>
        <v-text-field
          v-if="hasMaximumPerUser"
          v-model="formData.maximumRedemptionsPerUser"
          variant="solo"
          rounded="lg"
          label="Maximum Per User"
          :rules="[required, positiveNumber]"
        ></v-text-field>
        <ImageInput v-model="image" :image-name="formData.imageName" />
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
  </v-dialog>
</template>
