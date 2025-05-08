import apiClient from "./services.js";

export default {
  getAllSemesters() {
    return apiClient.get("/semesters");
  },
};
