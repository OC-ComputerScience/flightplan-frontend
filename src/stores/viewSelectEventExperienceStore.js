import { defineStore } from "pinia";

export const viewSelectEventExperienceStore = defineStore(
  "viewSelectEventExperience",
  {
    state: () => ({
      visible: false,
    }),
    actions: {
      toggleVisibility() {
        this.visible = !this.visible;
      },
    },
  },
);
