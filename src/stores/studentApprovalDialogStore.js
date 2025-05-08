import { defineStore } from "pinia";

export const studentApprovalDialogStore = defineStore("studentApprovalDialog", {
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
});
