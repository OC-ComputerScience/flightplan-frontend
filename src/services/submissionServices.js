import apiClient from "./services";

export default {
  createSubmission(submissionData) {
    return apiClient.post("/submission", submissionData);
  },
  createSubmissions(submissionData) {
    return apiClient.post("/submission/bulk", submissionData);
  },
  getSubmissionsForFlightPlanItem(flightPlanItemId) {
    return apiClient.get(`/submission/flightPlanItem/${flightPlanItemId}`);
  },
  discardSubmissionForFlightPlanItem(flightPlanItemId) {
    return apiClient.delete(`/submission/flightPlanItem/${flightPlanItemId}`);
  },
};
