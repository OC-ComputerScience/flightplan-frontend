<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { loadImage } from "../componentUtilities";
import defaultImage from "/defaultRewardImage.png";
import fileServices from "../../services/fileServices";
import studentRewardServices from "../../services/studentRewardServices";
// Props and Emits
const props = defineProps({
  reward: { type: Object, required: true },
  isView: { type: Boolean, default: true },
  variant: { type: String, default: "default" },
  studentPoints: { type: Number, default: 0 },
  maintenanceView: { type: Boolean, default: false },
  student: { type: Object, default: null },
});

watch(
  () => props.reward.imageName,
  () => {
    fetchImage();
  },
  { deep: true },
);

watch(
  () => props.studentPoints,
  () => {
    fetchAmountRedeemed();
  },
  { deep: true },
);

const emit = defineEmits(["edit", "shop", "show", "redeem"]);

// State
const imageSrc = ref("");
const amountRedeemed = ref(null);

const fetchImage = async () => {
  const response = await fileServices.getFileForName(props.reward.imageName);
  if (!response.data.image) imageSrc.value = defaultImage;
  else imageSrc.value = loadImage(response.data.image.data);
};

const fetchAmountRedeemed = async () => {
  if (!hasMaximumPerUser.value || !props.student?.id) {
    return;
  }
  amountRedeemed.value = (
    await studentRewardServices.getAllStudentRewardsForStudentAndReward(
      props.student.id,
      props.reward.id,
    )
  ).data.length;
};

// Computed Properties
const canRedeem = computed(() => props.studentPoints >= props.reward.points);
const inStock = computed(() => {
  return (
    props.reward.quantityAvaliable === null ||
    props.reward.quantityAvaliable > 0
  );
});
const hasMaximumPerUser = computed(
  () => !!props.reward?.maximumRedemptionsPerUser,
);

const redeemable = computed(() => {
  if (hasMaximumPerUser.value) {
    if (amountRedeemed.value !== null && amountRedeemed.value !== undefined) {
      return (
        canRedeem.value &&
        inStock.value &&
        props.reward.maximumRedemptionsPerUser > amountRedeemed.value
      );
    }
  }
  return canRedeem.value && inStock.value;
});

// Lifecycle Hooks
onMounted(async () => {
  await fetchImage();
  await fetchAmountRedeemed();
});
onUnmounted(() => URL.revokeObjectURL(imageSrc.value));
</script>

<template>
  <v-card 
    :color="'backgroundDarken'" 
    class="rounded-xl"
    @click="
      emit('show', { ...props.reward, amountRedeemed: amountRedeemed?.value })
    "
  >
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

      <!-- Points Display -->
      <p v-if="!props.maintenanceView" class="text-subtitle-1 text-center my-2">
        {{
          canRedeem
            ? `${props.reward.points} pts`
            : `Not enough points (${props.reward.points} pts)`
        }}
      </p>

      <p class="text-subtitle-1 text-center my-2">
        {{
          props.reward.quantityAvaliable !== null
            ? props.reward.quantityAvaliable > 0
              ? `${props.reward.quantityAvaliable} Remaining`
              : "Out of Stock"
            : "Unlimited Stock"
        }}
      </p>
      <p
        v-if="hasMaximumPerUser && !props.maintenanceView"
        class="text-subtitle-1 text-center my-2"
      >
        {{ amountRedeemed ? amountRedeemed : 0 }} Reedemed /
        {{ props.reward.maximumRedemptionsPerUser }} Per Student
      </p>
      <p v-if="props.maintenanceView" class="text-subtitle-1 text-center my-2">
        Status: {{ props.reward.status }}
      </p>

      <!-- Action Buttons -->
      <v-row class="ma-2 justify-center">
        <!-- Default Variant Buttons -->
        <template v-if="props.variant === 'default'">
          <v-btn
            v-if="isView"
            color="primary"
            class="rounded-lg"
            @click.stop="emit('show', props.reward)"
          >
            <v-icon icon="mdi-eye" color="text" size="x-large" />
          </v-btn>

          <template v-else>
            <v-btn
              color="warning"
              class="mr-2 rounded-lg"
              @click.stop="emit('edit', props.reward.id)"
            >
              <v-icon icon="mdi-pencil" color="text" size="x-large" />
            </v-btn>
          </template>
        </template>

        <!-- Redeem Variant Buttons -->
        <template v-else-if="props.variant === 'redeem'">
          <v-btn
            :color="redeemable ? 'primary' : 'danger'"
            class="rounded-lg"
            :variant="!redeemable ? 'outlined' : undefined"
            :readonly="!redeemable"
            @click.stop="canRedeem && inStock && emit('redeem', props.reward)"
          >
            {{
              hasMaximumPerUser && amountRedeemed
                ? props.reward?.maximumRedemptionsPerUser > amountRedeemed
                  ? inStock
                    ? canRedeem
                      ? "Redeem"
                      : "Not enough points"
                    : "Out of stock"
                  : "Maximum Redeemed"
                : inStock
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
