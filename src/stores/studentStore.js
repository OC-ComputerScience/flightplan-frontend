import { defineStore } from "pinia";
import Utils from "../config/utils";

import strengthServices from "../services/strengthServices";

export const studentStore = defineStore("student", {
  state: () => ({
    student: null,
    strengths: null,
  }),
  actions: {
    async getStrengths() {
      if (!this.strengths) {
        await this.setupStore();
      }
      return this.strengths;
    },
    async setupStore() {
      const student = Utils.getStore("student");
      let strengths = [];
      if (student) {
        strengths = await strengthServices.getStrengthsForStudent(student.id);
      }

      this.$patch({ student, strengths: strengths.data });
    },
    initalSetup() {
      const student = Utils.getStore("student");
      this.$patch({ student });
    },
  },
});
