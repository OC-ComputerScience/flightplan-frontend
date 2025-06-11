import apiClient from "./services.js";
export default {
  getAllTasks(page, pageSize, searchQuery, filters) {
    return apiClient.get("/task", {
      params: {
        page: page,
        pageSize: pageSize,
        searchQuery: searchQuery,
        category: filters?.category,
        taskType: filters?.taskType,
        schedulingType: filters?.schedulingType,
        completionType: filters?.completionType,
        semestersFromGraduation: filters?.semestersFromGraduation,
        strengths: filters?.strengths,
        sortAttribute: filters?.sortAttribute,
        sortDirection: filters?.sortDirection,
      },
    });
  },
  getTask(taskId) {
    return apiClient.get(`/task/${taskId}`);
  },
  getCategories() {
    return apiClient.get("/task/types/categories");
  },
  getSchedulingTypes() {
    return apiClient.get("/task/types/schedulingTypes");
  },
  getSubmissionTypes() {
    return apiClient.get("/task/types/submissionTypes");
  },
  createTask(taskData) {
    return apiClient.post("/task", taskData);
  },
  updateTask(taskId, taskData) {
    return apiClient.put(`/task/${taskId}`, taskData);
  },
  deleteTask(taskId) {
    return apiClient.delete(`/task/${taskId}`);
  },
  addMajor(taskId, majorId) {
    console.log("Adding major:", majorId, "to task:", taskId);
    return apiClient.post(`/task/${taskId}/majors/${majorId}`);
  },
  removeMajor(taskId, majorId) {
    return apiClient.delete(`/task/${taskId}/majors/${majorId}`);
  },
  getAllOptionalTasksForStudent(studentId, searchQuery) {
    return apiClient.get(`/task/optional/${studentId}`, {
      params: {
        searchQuery: searchQuery,
      },
    });
  },
};
