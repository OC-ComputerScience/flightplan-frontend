import { defineStore } from "pinia";

export const useFlightPlanStore = defineStore("flightPlan", {
  state: () => ({
    activeFlightPlanItem: null,
    selectedSemester: null,
  }),
  actions: {
    setActiveFlightPlanItem(item) {
      this.activeFlightPlanItem = item;
    },
    clearActiveFlightPlanItem() {
      this.activeFlightPlanItem = null;
    },
    setSelectedSemester(semester) {
      this.selectedSemester = semester;
    },
    clearSelectedSemester() {
      this.selectedSemester = null;
    },
  },
});
