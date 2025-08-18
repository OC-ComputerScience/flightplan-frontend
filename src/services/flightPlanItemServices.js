import apiClient from "./services";
export default {
  getAllFlightPlanItemsForFlightPlan(
    flightPlanId,
    { page, pageSize, searchQuery, filters },
  ) {
    return apiClient.get(`/flightPlanItem/flightPlan/${flightPlanId}`, {
      params: {
        page,
        pageSize,
        searchQuery,
        status: filters?.status,
        flightPlanItemType: filters?.flightPlanItemType,
      },
    });
  },
  getFlightPlanItemsWithEventsForStudent(studentId, flightPlanId) {
    return apiClient.get(
      `/flightPlanItem/student/${studentId}/flightplan/${flightPlanId}/with-events`,
    );
  },
  getFlightPlanItemTypes() {
    return apiClient.get("/flightPlanItem/types");
  },
  getFlightPlanItemStatuses() {
    return apiClient.get("/flightPlanItem/statuses");
  },
  createFlightPlanItem(flightPlanItem) {
    return apiClient.post("/flightPlanItem", flightPlanItem);
  },
  updateFlightPlanItem(flightPlanItem) {
    return apiClient.put(
      `/flightPlanItem/${flightPlanItem.id}`,
      flightPlanItem,
    );
  },
  getPendingApprovals(page = 1, pageSize = 10, searchQuery = "") {
    return apiClient.get("/flightPlanItem/pendingApprovals", {
      params: {
        page,
        pageSize,
        searchQuery,
      },
    });
  },
  approveFlightPlanItemsForTaskForStudents(studentEmails, taskId) {
    return apiClient.put(`/flightPlanItem/task/${taskId}/approve`, {
      studentEmails,
    });
  },
  approveFlightPlanItem(flightPlanItemId) {
    return apiClient.put(`/flightPlanItem/${flightPlanItemId}/approve`);
  },
  rejectFlightPlanItem(flightPlanItemId) {
    return apiClient.put(`/flightPlanItem/${flightPlanItemId}/reject`);
  },
  deleteFlightPlanItem(flightPlanItemId) {
    return apiClient.delete(`/flightPlanItem/${flightPlanItemId}`);
  },
};
