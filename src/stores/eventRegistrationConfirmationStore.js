import { defineStore } from "pinia";
import { ref } from "vue";

export const eventRegistrationConfirmationStore = defineStore("eventRegistrationConfirmation", () => {
  const visible = ref(false);
  const isRegistering = ref(false);

  function toggleVisibility(val) {
    visible.value = val;
  }

    function toggleRegistration(val) {
    isRegistering.value = val;
  }
  return { visible, isRegistering, toggleVisibility, toggleRegistration };
});