<script setup>
import { storeToRefs } from "pinia";
import { eventRegistrationConfirmationStore } from "../../stores/eventRegistrationConfirmationStore";

const props = defineProps({
  message: {
    type: String,
    required: true,
  },
});

const store = eventRegistrationConfirmationStore();
const { visible, isRegistering } = storeToRefs(store);
</script>

<template>
  <v-snackbar
    v-model="visible"
    :timeout="isRegistering ? 5000 : 2000"
    location="bottom"
    color="green"
  >
    {{ message }}
  </v-snackbar>
</template>