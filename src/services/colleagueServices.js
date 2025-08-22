import apiClient from "./services.js";

export default {
  // expects data in the form of {email: "email string"}
  getColleagueDataForStudentWithEmail(emailData) {
    return apiClient.get(`/colleague/getStudentForEmail`, {
      params: emailData,
    });
  },
  // expects data in the form of {OCStudentId: "oc student id string"}
  getColleagueDataForStudentWithOCStudentId(OCStudentIdData) {
    return apiClient.get(`/colleague/getStudentForOCStudentId`, {
      params: OCStudentIdData,
    });
  },
  createNewStudentForUserId(userId) {
    return apiClient.post(`/colleague/createNewStudentForUserId/${userId}`);
  },
  checkUpdateStudentWithForStudentId(studentId) {
    return apiClient.put(
      `/colleague/checkUpdateStudentWithColleagueDataForStudentId/${studentId}`,
    );
  },
};
