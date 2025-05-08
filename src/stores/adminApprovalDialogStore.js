import { defineStore } from "pinia";

export const adminApprovalDialogStore = defineStore("adminApprovalDialog", {
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
