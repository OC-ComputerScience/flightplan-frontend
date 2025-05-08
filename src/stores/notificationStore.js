import { defineStore } from "pinia";

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    activeNotification: null,
  }),
  actions: {
    setActiveNotification(id) {
      this.activeNotification = id;
    },
  },
});
