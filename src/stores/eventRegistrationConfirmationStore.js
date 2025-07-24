import { defineStore } from "pinia";

export const eventRegistrationConfirmationStore = defineStore("eventRegistrationConfirmation", {
  state: () => ({
    visible: false,
    isRegistering: false,
  }),
  actions: {
    toggleVisibility(val) {
      this.visible = val;
    },
    toggleRegistration(val) {
      this.isRegistering = val;
    },
  },
});