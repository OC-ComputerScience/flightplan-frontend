import apiClient from "./services.js";

export default {
  getMajorsForStudent(studentId) {
    return apiClient.get(`/majors/student/${studentId}`);
  },

  getMajorForExperience(experienceId) {
    return apiClient.get(`/majors/experience/${experienceId}`);
  },

  getMajorForTask(taskId) {
    return apiClient.get(`/majors/task/${taskId}`);
  },

  getAllMajors(page, pageSize, searchQuery, filters = {}) {
    return apiClient.get("/majors", {
      params: {
        page: page,
        pageSize: pageSize,
        searchQuery: searchQuery,
        sortAttribute: filters?.sortAttribute,
        sortDirection: filters?.sortDirection,
      },
    });
  },

  getMajor(majorId) {
    return apiClient.get(`/majors/${majorId}`);
  },

  createMajor(majorData) {
    return apiClient.post("/majors", majorData);
  },

  updateMajor(majorId, majorData) {
    return apiClient.put(`/majors/${majorId}`, majorData);
  },

  deleteMajor(majorId) {
    return apiClient.delete(`/majors/${majorId}`);
  },
};
