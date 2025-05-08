import { defineStore } from "pinia";

export const addExperienceToBadgeStore = defineStore("addExperienceToBadge", {
  state: () => ({
    visible: false,
  }),
  actions: {
    toggleVisibility() {
      this.visible = !this.visible;
    },
  },
});
