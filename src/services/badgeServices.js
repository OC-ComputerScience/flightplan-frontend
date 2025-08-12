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
  getStatusTypes() {
    return apiClient.get("/badge/types/statusTypes");
  },
  getUnviewedBadges(studentId) {
    return apiClient.get(`/badge/student/${studentId}/unviewed`);
  },
  getAllActiveBadges(page = 1, pageSize = 6) {
    return apiClient.get("/badge/active", {
      params: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
      },
    });
  },
  getAllInactiveBadges() {
    return apiClient.get("/badge/inactive");
  },
  viewBadge(badgeId) {
    return apiClient.put(`/badge/${badgeId}/view`);
  },
};
