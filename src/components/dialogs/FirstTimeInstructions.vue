<script setup>
import { ref } from "vue";

const formatDate = (date) => {
  const options = { 
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};

const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);
const todayPlusYear = formatDate(futureDate);

const visible = ref(true);
const noShowInstructions = ref(false);

const closeDialogue = () => {
  visible.value = false;
  if (!noShowInstructions.value)  return;
  document.cookie = `showFirstTimeInstructions=false; expires=${todayPlusYear} 12:00:00 UTC`;
};
</script>

<template>
  <v-dialog v-model="visible" max-width="50%"class="rounded-xl">
    <v-card class="rounded-xl">
      <v-card-title class="text-h5 text-center pt-4 pr-4 pl-4">
        Welcome to OC Career Service's Flight Plan!
      </v-card-title>
      <v-card-text class="text-center pb-8 pl-16 pr-16 pt-6">
        <p class="text-left pb-8">
          The Eagle Flight Plan is a guide to help you be well-prepared to get a job when you graduate! A new flight plan will be set up for you each semester with tasks and experiences customized for you to complete. As you complete tasks and experiences, you will receive points and badges. You will be able to redeem points for rewards that you will enjoy such as professional clothing, OC merchandise, special lunches, and more. Ready to take off?
        </p>
        <p class="text-h6">Useful Definitions to Know:</p>
        <ul class="text-left mt-2">
          <li>
            <strong>Flight Plan:</strong> A  checklist of tasks and experiences created for you each semester that you can complete to help
            prepare you for your career during your time at OC
          </li>
          <li>
            <strong>Task:</strong> Actions you can take to help prepare you for the future, such as writing a
            resume or meeting with your advisor
          </li>
          <li>
            <strong>Experience:</strong>Events at OC you can attend to help further your growth,
            such as career fairs or conferences
          </li>
        </ul>

        <!-- <p class="text-body-1 mt-2">
          (I'm sorry Dr. Shank, it's been too long since I took technical writing)
        </p> -->
      </v-card-text>

      <v-card-actions class="pb-4 pr-4 pl-4">
        <v-col class="d-flex flex-column align-center">
          <v-checkbox
            v-model="noShowInstructions"
            label="Don't show me this again"
            density="compact"
          ></v-checkbox>
          <v-btn
            color="primary"
            variant="text"
            class="rounded-lg"
            @click="closeDialogue"
          >
            Close
          </v-btn>
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
