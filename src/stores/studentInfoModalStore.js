import { defineStore } from "pinia";

export const studentInfoModalStore = defineStore("studentInfoModal", {
  state: () => ({
    visible: false,
  }),
  actions: {
    toggleVisibility() {
      this.visible = !this.visible;
    },
    show() {
      this.visible = true;
    },
    hide() {
      this.visible = false;
    },
  },
});
