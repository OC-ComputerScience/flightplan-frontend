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
  if (noShowInstructions.value)  return;
  //document.cookie = `showFirstTimeInstructions=false; expires=${todayPlusYear} 12:00:00 UTC`;
};
</script>

<template>
  <v-dialog v-model="visible" max-width="50%"class="rounded-xl">
    <v-card>
      <v-card-title class="text-h5 text-center pa-4">
        Welcome to OC Career Service's Flight Plan!
      </v-card-title>

      <v-card-text class="text-center pa-16">
        <p class="text-h6">Some definitions or something idk:</p>
        <ul class="text-left mt-2">
          <li>
            Flight Plan: A semesterly checklist of things you can do to help
            prepare you for your career during your time at OC
          </li>
          <li>
            Task: Actions you can take to help prepare you, such as writing a
            resume or meeting with your advisor
          </li>
          <li>
            Experience: Events at OC you can attend to help further your growth,
            like a career fair or conference
          </li>
        </ul>

        <p class="text-body-1 mt-2">
          I'm sorry Dr. Shank, it's been too long since I took technical writing
        </p>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-row class="d-flex justify-center align-center mt-4">
          <v-col>
            <v-checkbox
              v-model="noShowInstructions"
              label="Don't show me this again"
              density="compact"
            ></v-checkbox>
          </v-col>
        </v-row>
        <v-row class="d-flex justify-center mt-4">
          <v-col>
            <v-btn
              color="primary"
              variant="text"
              class="rounded-lg"
              @click="closeDialogue"
            >
              Close
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
