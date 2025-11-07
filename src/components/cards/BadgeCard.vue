<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import defaultImage from "../../assets/DefaultBadgeImage.png";
import { loadImage } from "../componentUtilities";
import fileServices from "../../services/fileServices";
const props = defineProps({
  badge: { type: Object, required: true },
  isProfilePage: { type: Boolean, default: false },
});

watch(
  () => props.badge.imageName,
  () => {
    fetchImage();
  },
  { deep: true },
);

const emit = defineEmits(["edit", "delete", "view"]);

const emitView = () => {
  emit("view", { ...props.badge });
};

const imageSrc = ref("");

const fetchImage = async () => {
  const response = await fileServices.getFileForName(props.badge.imageName);
  if (!response.data.image) imageSrc.value = defaultImage;
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
  <v-card
    :class="['rounded-xl', cardClass, 'bg-backgroundDarken']"
    class="rounded-xl h-100 cardContainer d-flex flex-column"
    @click="emitView()"
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
    </v-card-text>
    <v-card-subtitle v-show="!props.isProfilePage" class="mt-auto pa-0">
      <div class="ma-2 float-end">
        <v-btn
          color="warning"
          class="mr-2 rounded-lg"
          @click="emit('edit', props.badge.id)"
        >
          <v-icon icon="mdi-pencil" color="text" size="x-large"></v-icon>
        </v-btn>
      </div>
    </v-card-subtitle>
  </v-card>
</template>

<style scoped>
.image {
  max-height: 150px;
}

.profile-card {
  min-width: 150px;
  max-width: 200px;
}

.profile-card .image {
  max-height: 100px;
}

.profile-card :deep(.text-subtitle-1) {
  font-size: 12px;
}
</style>
