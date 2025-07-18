import { defineStore } from "pinia";

export const viewAwardedBadgeStore = defineStore("viewAwardedBadge", {
  state: () => ({
    visible: false,
  }),
  actions: {
    toggleVisibility() {
      this.visible = !this.visible;
    },
  },
});
