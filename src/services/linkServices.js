import apiClient from "./services.js";

export default {
  getAllLinksForUser(id) {
    return apiClient.get(`/link/user/${id}`);
  },
  createLink(linkData) {
    return apiClient.post("/link", linkData);
  },
  updateLink(id, linkData) {
    return apiClient.put(`/link/${id}`, linkData);
  },
  deleteLink(id) {
    return apiClient.delete(`/link/${id}`);
  },
};
