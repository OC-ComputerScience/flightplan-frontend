<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import defaultImage from "../../assets/DefaultBadgeImage.png";
import { loadImage } from "../componentUtilities";
import fileServices from "../../services/fileServices";

const props = defineProps({
  badge: { type: Object, required: true },
});

const imageSrc = ref("");

const fetchImage = async () => {
  const response = await fileServices.getFileForName(props.badge.imageName);
  if (!response.data.image) return;
  imageSrc.value = loadImage(response.data.image.data);
};

onMounted(async () => {
  await fetchImage();
});
onUnmounted(() => URL.revokeObjectURL(imageSrc.value));
</script>

<template>
  <v-card
    color="backgroundDarken"
    class="student-badge-card rounded-xl pa-4 mb-3"
    elevation="2"
    style="width: 100%"
  >
    <div class="d-flex align-start mb-2">
      <v-img
        :src="imageSrc || defaultImage"
        class="badge-image mr-4"
        alt="Badge Image"
        cover
      />
      <div class="flex-grow-1">
        <div class="d-flex flex-column">
          <span
            class="font-weight-bold mb-1"
            style="font-size: 1.1rem; font-weight: 500"
            >{{ props.badge.name }}</span
          >
        </div>
        <div class="badge-description mt-2">
          {{ props.badge.description || "No description available." }}
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.student-badge-card {
  width: 100%;
  min-width: 200px;
  max-width: 100%;
  box-sizing: border-box;
}
.badge-image {
  border-radius: 12px;
  object-fit: cover;
  min-width: 70px;
  min-height: 70px;
  max-width: 70px;
  max-height: 70px;
}
.badge-description {
  margin-top: 10px;
  font-size: 0.95rem;
  line-height: 1.4;
}
</style>
