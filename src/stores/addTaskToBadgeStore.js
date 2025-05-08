import { defineStore } from "pinia";

export const addTaskToBadgeStore = defineStore("addTaskToBadge", {
  state: () => ({
    visible: false,
  }),
  actions: {
    toggleVisibility() {
      this.visible = !this.visible;
    },
  },
});
