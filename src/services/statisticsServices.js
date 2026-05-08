import apiClient from "./services.js";

export default {
  getStudentSemesterCount(semesterId = null) {
    return apiClient.get("/statistics/getStudentSemesterCount", {
      params: { semesterId },
    });
  },
  getStudentCountsForCompletedItems(semesterId = null) {
    return apiClient.get("/statistics/getStudentCountsForCompletedItems", {
      params: { semesterId },
    });
  },
};
