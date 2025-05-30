import apiClient from "./services.js";

export default {
  getStrengthsForStudent(studentId) {
    return apiClient.get(`/strengths/student/${studentId}`);
  },
  getStrengthForExperience(experienceId) {
    return apiClient.get(`/strengths/experience/${experienceId}`);
  },
  getAllStrengths() {
    return apiClient.get(`/strengths`);
  },
};
