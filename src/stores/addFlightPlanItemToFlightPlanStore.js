import { defineStore } from "pinia";

export const addFlightPlanItemToFlightPlanStore = defineStore(
  "addFlightPlanItemToFlightPlan",
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
