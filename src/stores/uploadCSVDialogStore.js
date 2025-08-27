import { defineStore } from "pinia";

export const uploadCSVDialogStore = defineStore("uploadCSVDialogStore", {
  state: () => ({
    visible: false,
    error: false,
    errorMessage: "",
  }),
  actions: {
    toggleVisibility() {
      this.visible = !this.visible;
    },
    toggleError() {
      this.error = !this.error;
    },
    setError(bool) {
      this.error = bool;
    },
    setErrorMessage(newErrorMessage) {
      this.errorMessage = newErrorMessage;
    },
  },
});
