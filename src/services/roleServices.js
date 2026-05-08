import apiClient from "./services.js";
export default {
  getRolesByEmail(email) {
    return apiClient.get(`/role/email/${email}`);
  },
  getAllRoles() {
    return apiClient.get("/role");
  },
};
