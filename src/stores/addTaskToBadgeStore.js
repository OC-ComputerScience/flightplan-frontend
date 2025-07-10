import { defineStore } from "pinia";

export const addTaskToBadgeStore = defineStore("addTaskToBadge", {
  state: () => ({
    visible: false,
    selectedRuleTask: null,
  }),
  actions: {
    toggleVisibility() {
      this.visible = !this.visible;
    },
    setSelectedRuleTask(ruleTask) {
      this.selectedRuleTask = ruleTask;
    },
    clearSelectedRuleTask() {
      this.selectedRuleTask = null;
    },
    addRuleTask() {
      this.clearSelectedRuleTask();
      this.toggleVisibility();
    },
    editRuleTask(ruleTask) {
      this.setSelectedRuleTask(ruleTask);
      this.toggleVisibility();
    },
  },
});
