import apiClient from "./services.js";

export default {
  getAllSemesters() {
    return apiClient.get("/semesters");
  },
  getAllSemestersUnfiltered() {
    return apiClient.get("/semesters/all");
  },
  getAllSemestersForAdmin(page = 1, pageSize = 12, searchQuery, filters = {}) {
    return apiClient.get("/semesters/admin", {
      params: {
        page,
        pageSize,
        searchQuery,
        sortAttribute: filters?.sortAttribute,
        sortDirection: filters?.sortDirection,
      },
    });
  },
  getSemester(semesterId) {
    return apiClient.get(`/semesters/${semesterId}`);
  },
  createSemester(semesterData) {
    return apiClient.post("/semesters", semesterData);
  },
  updateSemester(semesterId, semesterData) {
    return apiClient.put(`/semesters/${semesterId}`, semesterData);
  },
  deleteSemester(semesterId) {
    return apiClient.delete(`/semesters/${semesterId}`);
  },
};
