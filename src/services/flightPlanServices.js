import apiClient from "./services";
export default {
  getFlightPlanForStudent(studentId) {
    return apiClient.get(`/flightPlan/student/${studentId}`);
  },
  getFlightPlanProgressForFlightPlan(flightPlanId) {
    return apiClient.get(`/flightPlan/progress/${flightPlanId}`);
  },
  generateFlightPlan(studentId) {
    return apiClient.post(`/flightPlan/generate/${studentId}`);
  },
};
