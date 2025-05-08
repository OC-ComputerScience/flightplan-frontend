import apiClient from "./services.js";

export default {
  getAllLinksForUser(id) {
    return apiClient.get(`/link/user/${id}`);
  },
};
