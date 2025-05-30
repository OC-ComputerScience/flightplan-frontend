import apiClient from "./services.js";
export default {
  getAllExperiences(page, pageSize, searchQuery) {
    return apiClient.get("/experience", {
      params: {
        page: page,
        pageSize: pageSize,
        searchQuery: searchQuery,
      },
    });
  },

  getExperience(experienceId) {
    return apiClient.get(`/experience/${experienceId}`);
  },
  getSchedulingTypes() {
    return apiClient.get("/experience/types/schedulingTypes");
  },
  getSubmissionTypes() {
    return apiClient.get("/experience/types/submissionTypes");
  },
  getCategories() {
    return apiClient.get("/experience/types/categories");
  },
  createExperience(experienceData) {
    return apiClient.post("/experience", experienceData);
  },
  updateExperience(experienceId, experienceData) {
    return apiClient.put(`/experience/${experienceId}`, experienceData);
  },
  deleteExperience(experienceId) {
    return apiClient.delete(`/experience/${experienceId}`);
  },
  getAllOptionalExperiencesForStudent(studentId, searchQuery) {
    return apiClient.get(`/experience/optional/${studentId}`, {
      params: {
        searchQuery: searchQuery,
      },
    });
  },
  addStrength(experienceId, strengthId) {
    return apiClient.put(`/experience/${experienceId}/strengths`, {
      strengthId,
    });
  },
  removeStrength(experienceId, strengthId) {
    return apiClient.delete(`/experience/${experienceId}/strengths`, {
      data: { strengthId },
    });
  },
};
