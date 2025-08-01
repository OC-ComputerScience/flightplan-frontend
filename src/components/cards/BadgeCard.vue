<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import defaultImage from "../../assets/DefaultBadgeImage.png";
import { loadImage } from "../componentUtilities";
import fileServices from "../../services/fileServices";
const props = defineProps({
  badge: { type: Object, required: true },
  isProfilePage: { type: Boolean, default: false },
});
const emit = defineEmits(["edit", "delete", "view"]);

const imageSrc = ref("");

const fetchImage = async () => {
  const response = await fileServices.getFileForName(props.badge.imageName);
  if (!response.data.image) return;
  imageSrc.value = loadImage(response.data.image.data);
};

// Vue functions
onMounted(async () => {
  await fetchImage();
});
onUnmounted(() => URL.revokeObjectURL(imageSrc.value));

// Computed property to determine the card style
const cardClass = computed(() => {
  return props.isProfilePage ? "profile-card" : "";
});
</script>

<template>
  <!--Need to add a filter for Active and Inactive badges-->
  <v-card
    :class="['rounded-xl', cardClass, 'bg-backgroundDarken']"
    v-bind="
      props.isProfilePage
        ? {
            onClick: () => emit('view', props.badge),
          }
        : {}
    "
  >
    <v-card-text>
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
      <p class="text-subtitle-1 text-center my-2">
        {{ props.badge.name }}
      </p>
      <v-row v-show="!props.isProfilePage" class="ma-2 justify-center">
        <v-btn
          color="warning"
          class="mr-2 rounded-lg"
          @click="emit('edit', props.badge.id)"
        >
          <v-icon icon="mdi-pencil" color="text" size="x-large"></v-icon>
        </v-btn>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.image {
  max-height: 150px;
}

.profile-card {
  max-width: 200px;
}

.profile-card .image {
  max-height: 100px;
}

.profile-card :deep(.text-subtitle-1) {
  font-size: 12px;
}
</style>
