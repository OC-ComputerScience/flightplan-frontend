import apiClient from "./services.js";
export default {
  getAllExperiences(page, pageSize, searchQuery, filters = {}) {
    return apiClient.get("/experience", {
      params: {
        page,
        pageSize,
        searchQuery,
        category: filters?.category,
        schedulingType: filters?.schedulingType,
        submissionType: filters?.submissionType,
        status: filters?.status,
        sortAttribute: filters?.sortAttribute,
        sortDirection: filters?.sortDirection,
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
  getStatusTypes() {
    return apiClient.get("/experience/types/statusTypes");
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
  getAllOptionalExperiencesForStudent(studentId, searchQuery) {
    return apiClient.get(`/experience/optional/${studentId}`, {
      params: {
        searchQuery: searchQuery,
      },
    });
  },
  getAllActiveExperiences(searchQuery) {
    return apiClient.get("/experience/active", {
      params: {
        searchQuery: searchQuery,
      },
    });
  },
  getAllExperiencesForEvent(eventId) {
    return apiClient.get(`/experience/event/${eventId}`);
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
  addMajor(experienceId, majorId) {
    return apiClient.put(`/experience/${experienceId}/majors`, {
      majorId,
    });
  },
  removeMajor(experienceId, majorId) {
    return apiClient.delete(`/experience/${experienceId}/majors`, {
      data: { majorId },
    });
  },
};
