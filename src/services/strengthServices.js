import apiClient from "./services.js";

export default {
  getStrengthsForStudent(studentId) {
    return apiClient.get(`/strengths/student/${studentId}`);
  },
  getAllStrengths() {
    return apiClient.get(`/strengths`);
  },
};
