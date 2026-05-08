import apiClient from "./services.js";

export default {
  getAllUserRoles() {
    return apiClient.get("/userrole");
  },
  createUserRole(payload) {
    return apiClient.post("/userrole", payload);
  },
  deleteUserRole(id) {
    return apiClient.delete(`/userrole/${id}`);
  },
};
