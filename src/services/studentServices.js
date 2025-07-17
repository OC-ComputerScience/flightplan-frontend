import apiClient from "./services.js";
export default {
  getStudentForUserId(userId) {
    return apiClient.get(`/students/user/${userId}`);
  },
  getStudentForFlightPlanId(flightPlanId) {
    return apiClient.get(`/students/flightPlan/${flightPlanId}`);
  },
  getStudent(studentId) {
    return apiClient.get(`/students/${studentId}`);
  },
  checkStudentSemesterFromGraduation(studentId) {
    return apiClient.put(`/students/${studentId}/checkSemesterFromGraduation`);
  },
  updatePoints(studentId, points) {
    console.log("points", points);
    return apiClient.put(`/students/${studentId}/points`, { points });
  },
  getPoints(studentId) {
    return apiClient.get(`/students/${studentId}/points`);
  },
  getAllStudents() {
    return apiClient.get("/students");
  },
  getStudentById(id) {
    return apiClient.get(`/students/${id}`);
  },
  deleteStudent(id) {
    return apiClient.delete(`/students/${id}`);
  },
  createStudent(item) {
    return apiClient.post(`/students`, item);
  },
  updateStudent(item) {
    return apiClient.put(`/students/${item.id}`, item);
  },
  addMajor(studentId, majorId) {
    return apiClient.put(`/students/${studentId}/majors`, { majorId });
  },
  removeMajor(studentId, majorId) {
    return apiClient.delete(`/students/${studentId}/majors`, {
      data: { majorId },
    });
  },
  addStrength(studentId, strengthId) {
    return apiClient.put(`/students/${studentId}/strengths`, { strengthId });
  },
  removeStrength(studentId, strengthId) {
    return apiClient.delete(`/students/${studentId}/strengths`, {
      data: { strengthId },
    });
  },
};
