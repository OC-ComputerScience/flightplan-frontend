<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { loadImage } from "../componentUtilities";
import defaultImage from "/defaultRewardImage.png";
import fileServices from "../../services/fileServices";
// Props and Emits
const props = defineProps({
  reward: { type: Object, required: true },
  isView: { type: Boolean, default: true },
  variant: { type: String, default: "default" },
  studentPoints: { type: Number, default: 0 },
});

watch(
  () => props.reward.imageName,
  () => {
    fetchImage();
  },
  { deep: true },
);

const emit = defineEmits(["edit", "delete", "shop", "show", "redeem"]);

// State
const imageSrc = ref("");

const fetchImage = async () => {
  const response = await fileServices.getFileForName(props.reward.imageName);
  if (!response.data.image) imageSrc.value = defaultImage;
  else imageSrc.value = loadImage(response.data.image.data);
};

// Computed Properties
const canRedeem = computed(() => props.studentPoints >= props.reward.points);
const inStock = computed(() => {
  return (
    props.reward.quantityAvaliable === null ||
    props.reward.quantityAvaliable > 0
  );
});

// Lifecycle Hooks
onMounted(() => fetchImage());
onUnmounted(() => URL.revokeObjectURL(imageSrc.value));
</script>

<template>
  <v-card :color="'backgroundDarken'" class="rounded-xl">
    <v-card-text>
      <!-- Image Section -->
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

      <!-- Title Section -->
      <p class="text-h5 text-center my-2">
        {{ props.reward.name }}
      </p>

      <p class="text-subtitle-1 text-center my-2">
        {{
          props.reward.quantityAvaliable !== null
            ? props.reward.quantityAvaliable > 0
              ? `${props.reward.quantityAvaliable} Remaining`
              : "Out of Stock"
            : "Unlimited"
        }}
      </p>

      <!-- Points Display -->
      <p
        v-if="props.variant === 'redeem'"
        class="text-subtitle-1 text-center my-2"
      >
        {{ props.reward.points }} pts
      </p>

      <!-- Action Buttons -->
      <v-row class="ma-2 justify-center">
        <!-- Default Variant Buttons -->
        <template v-if="props.variant === 'default'">
          <v-btn
            v-if="isView"
            color="primary"
            class="rounded-lg"
            @click="emit('show', props.reward)"
          >
            <v-icon icon="mdi-eye" color="text" size="x-large" />
          </v-btn>

          <template v-else>
            <v-btn
              color="warning"
              class="mr-2 rounded-lg"
              @click="emit('edit', props.reward.id)"
            >
              <v-icon icon="mdi-pencil" color="text" size="x-large" />
            </v-btn>
            <v-btn
              color="danger"
              class="rounded-lg"
              @click="emit('delete', props.reward.id, props.reward.imageName)"
            >
              <v-icon icon="mdi-delete" color="text" size="x-large" />
            </v-btn>
          </template>
        </template>

        <!-- Redeem Variant Buttons -->
        <template v-else-if="props.variant === 'redeem'">
          <v-btn
            :color="canRedeem && inStock ? 'primary' : 'danger'"
            class="rounded-lg"
            :variant="!canRedeem || !inStock ? 'outlined' : undefined"
            :readonly="!canRedeem || !inStock"
            @click="canRedeem && inStock && emit('redeem', props.reward)"
          >
            {{
              inStock
                ? canRedeem
                  ? "Redeem"
                  : "Not enough points"
                : "Out of stock"
            }}
          </v-btn>
        </template>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.image {
  max-height: 125px;
}
</style>
