import { defineStore } from "pinia";

export const useSelectedStudentsStore = defineStore("selectedStudents", {
  state: () => ({
    selectedStudentIds: [], // Array to store selected student IDs
  }),
  actions: {
    addStudent(id) {
      if (!this.selectedStudentIds.includes(id)) {
        this.selectedStudentIds.push(id); // Add student ID if not already selected
      }
    },
    removeStudent(id) {
      this.selectedStudentIds = this.selectedStudentIds.filter(
        (studentId) => studentId !== id,
      ); // Remove student ID
    },
    toggleStudent(id) {
      if (this.selectedStudentIds.includes(id)) {
        this.removeStudent(id); // If already selected, remove it
      } else {
        this.addStudent(id); // Otherwise, add it
      }
    },
    clearSelection() {
      this.selectedStudentIds = []; // Clear all selected student IDs
    },
  },
});
