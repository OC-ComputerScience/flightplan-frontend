import apiClient from "./services.js";
export default {
  getAllBadges(page, pageSize, searchQuery) {
    return apiClient.get("/badge", {
      params: {
        page: page,
        pageSize: pageSize,
        searchQuery: searchQuery,
      },
    });
  },
  deleteBadge(badgeId) {
    return apiClient.delete(`/badge/${badgeId}`);
  },
  getBadge(badgeId) {
    return apiClient.get(`/badge/${badgeId}`);
  },
  createBadge(badgeData) {
    return apiClient.post("/badge", badgeData);
  },
  updateBadge(badgeId, badgeData) {
    return apiClient.put(`/badge/${badgeId}`, badgeData);
  },

  getBadgesForStudent(studentId, page = 1, pageSize = 10) {
    return apiClient.get(`/badge/student/${studentId}`, {
      params: {
        page,
        pageSize,
      },
    });
  },
  getRuleTypes() {
    return apiClient.get("/badge/types/rules");
  },
  getUnviewedBadges(studentId) {
    return apiClient.get(`/badge/student/${studentId}/unviewed`);
  },
  viewBadge(badgeId) {
    return apiClient.put(`/badge/${badgeId}/view`);
  },
};
