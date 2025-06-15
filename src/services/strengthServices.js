import apiClient from "./services.js";

export default {
  getStrengthsForStudent(studentId) {
    return apiClient.get(`/strengths/student/${studentId}`);
  },
  getStrengthForExperience(experienceId) {
    return apiClient.get(`/strengths/experience/${experienceId}`);
  },
  getStrengthForTask(taskId) {
    return apiClient.get(`/strengths/task/${taskId}`);
  },
  getAllStrengths() {
    return apiClient.get(`/strengths`);
  },
};
