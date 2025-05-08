import apiClient from "./services.js";
export default {
  getAllUser() {
    return apiClient.get("/user");
  },
  getAllUserForAdmin(page, pageSize, searchQuery) {
    return apiClient.get("/user/admin", {
      params: {
        page: page,
        pageSize: pageSize,
        searchQuery: searchQuery,
      },
    });
  },
  getOneUser(id) {
    return apiClient.get(`/user/${id}`);
  },
  getAllAdmins() {
    return apiClient.get("/user/admin/all");
  },
  getUserById(id) {
    return apiClient.get(`/user/${id}`);
  },
  deleteUser(id) {
    return apiClient.delete(`/user/${id}`);
  },
  createUser(item) {
    return apiClient.post(`/user`, item);
  },
  updateUser(item) {
    return apiClient.put(`/user/${item.id}`, item);
  },
  getUserByEmail(email) {
    return apiClient.get(`/user/email/${email}`);
  },
  promoteToAdmin(userId) {
    return apiClient
      .put(`/user/${userId}/promote-to-admin`)
      .then((response) => {
        if (
          typeof response.data === "string" &&
          response.data.startsWith("<!DOCTYPE")
        ) {
          throw new Error(
            "Server returned HTML instead of JSON. Check if the endpoint exists.",
          );
        }
        return response;
      })
      .catch((error) => {
        throw new Error(
          `Failed to promote user to admin: ${error.message}. Please check if the endpoint exists and is accessible.`,
        );
      });
  },
  demoteFromAdmin(userId) {
    return apiClient
      .put(`/user/${userId}/demote-from-admin`)
      .then((response) => {
        if (
          typeof response.data === "string" &&
          response.data.startsWith("<!DOCTYPE")
        ) {
          throw new Error(
            "Server returned HTML instead of JSON. Check if the endpoint exists.",
          );
        }
        return response;
      })
      .catch((error) => {
        throw new Error(
          `Failed to demote user from admin: ${error.message}. Please check if the endpoint exists and is accessible.`,
        );
      });
  },
};
