import apiClient from "./services.js";

export default {
  getAllSemesters() {
    return apiClient.get("/semesters");
  },
  getAllSemestersUnfiltered() {
    return apiClient.get("/semesters/all");
  },
};
