<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { viewAwardedBadgeStore } from "../../stores/viewAwardedBadgeStore";
import fileServices from "../../services/fileServices";
import { loadImage } from "../../components/componentUtilities";
import defaultImage from "../../assets/DefaultBadgeImage.png";
import dayjs from "dayjs";
const store = viewAwardedBadgeStore();
const { visible } = storeToRefs(store);

const props = defineProps({
  badge: {
    type: Object,
    required: true,
  },
});

const shownBadge = ref({});
const imageSrc = ref("");

const fetchImage = async (imageName) => {
  const response = await fileServices.getFileForName(imageName);
  if (!response.data.image) imageSrc.value = defaultImage;
  else imageSrc.value = loadImage(response.data.image.data);
};

watch(visible, () => {
  if (visible.value) {
    fetchImage(props.badge.imageName);
    shownBadge.value = props.badge;
  }
});
</script>
<template>
  <v-dialog v-model="visible" max-width="600">
    <v-card
      class="rounded-xl bg-backgroundDarken overflow-hidden"
      max-height="500"
    >
      <v-row class="pl-1 pa-4">
        <v-col cols="4">
          <v-img
            v-if="imageSrc"
            class="image"
            :src="imageSrc"
            alt="Uploaded Image"
          ></v-img>
          <v-img
            v-else
            class="image"
            :src="defaultImage"
            alt="Generic Merchandise Image"
          ></v-img>
        </v-col>
        <v-col cols="6">
          <p class="text-h4">{{ shownBadge?.name }}</p>
          <p class="text-h7">
            Acquired: {{ dayjs(shownBadge?.updatedAt).format("MMM D, YYYY") }}
          </p>
          <p class="text-h6">Description:</p>
          <p class="text-body-1">{{ shownBadge?.description }}</p>
        </v-col>
        <v-spacer></v-spacer>
        <v-btn
          icon
          variant="plain"
          rounded="xl"
          class="mr-2 rounded-lg"
          color="secondary"
          @click="store.toggleVisibility()"
        >
          <v-icon icon="mdi-close"></v-icon>
        </v-btn>
      </v-row>
    </v-card>
  </v-dialog>
</template>
