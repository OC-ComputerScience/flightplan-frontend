import { defineStore } from "pinia";

export const studentViewSubmissionDialogStore = defineStore(
  "studentViewSubmissionDialogStore",
  {
    state: () => ({
      visible: false,
      flightPlanItem: null,
    }),
    actions: {
      toggleVisibility() {
        this.visible = !this.visible;
      },
      setFlightPlanItem(newFlightPlanItem) {
        this.flightPlanItem = newFlightPlanItem;
      },
    },
  },
);
