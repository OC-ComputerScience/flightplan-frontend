import { defineStore } from "pinia";

export const viewBadgeAwardsStore = defineStore("viewBadgeAwards", {
  state: () => ({
    visible: false,
  }),
  actions: {
    toggleVisibility() {
      this.visible = !this.visible;
    },
  },
});
