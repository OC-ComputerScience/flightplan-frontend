import apiClient from "./services.js";

export default {
  getStudentSemesterCount() {
    return apiClient.get("/statistics/getStudentSemesterCount");
  },
  getStudentCountsForCompletedItems() {
    return apiClient.get("/statistics/getStudentCountsForCompletedItems");
  },
};
