import { defineStore } from "pinia";

export const addExperienceToBadgeStore = defineStore("addExperienceToBadge", {
  state: () => ({
    visible: false,
    selectedRuleExperience: null,
  }),
  actions: {
    toggleVisibility() {
      this.visible = !this.visible;
    },
    setSelectedRuleExperience(ruleExperience) {
      this.selectedRuleExperience = ruleExperience;
    },
    clearSelectedRuleExperience() {
      this.selectedRuleExperience = null;
    },
    addRuleExperience() {
      this.clearSelectedRuleExperience();
      this.toggleVisibility();
    },
    editRuleExperience(ruleExperience) {
      this.setSelectedRuleExperience(ruleExperience);
      this.toggleVisibility();
    },
  },
});
