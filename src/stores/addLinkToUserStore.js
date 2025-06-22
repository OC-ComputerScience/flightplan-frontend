import { defineStore } from "pinia";

export const addLinkToUserStore = defineStore("addLinkToUser", {
  state: () => ({
    visible: false,
  }),
  actions: {
    toggleVisibility() {
      this.visible = !this.visible;
    },
  },
});
