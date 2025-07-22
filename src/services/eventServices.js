import apiClient from "./services.js";
export default {
  getAllEvents(page = 1, pageSize = 10, searchQuery, filters) {
    return apiClient.get("/event", {
      params: {
        page: page,
        pageSize: pageSize,
        searchQuery: searchQuery,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        location: filters?.location,
        strengths: filters?.strengths,
        sortAttribute: filters?.sortAttribute,
        sortDirection: filters?.sortDirection,
      },
    });
  },
  getAllEventsForUser(id, page = 1, pageSize = 10) {
    return apiClient.get(`/event/user/${id}`, {
      params: { page, pageSize },
    });
  },
  getAllEventsForCalendar() {
    return apiClient.get("");
  },
  getEvent(eventId) {
    return apiClient.get(`/event/${eventId}`);
  },
  getEventByToken(eventToken) {
    return apiClient.get(`/event/token/${eventToken}`);
  },
  deleteEvent(eventId) {
    return apiClient.delete(`/event/${eventId}`);
  },
  createEvent(eventData) {
    return apiClient.post("/event", eventData);
  },
  updateEvent(eventId, eventData) {
    return apiClient.put(`/event/${eventId}`, eventData);
  },

  getCompletionTypes() {
    return apiClient.get("/event/types/completionTypes");
  },

  getAttendanceTypes() {
    return apiClient.get("/event/types/attendanceTypes");
  },

  // getEventTypes() {
  //   return apiClient.get("/event/types/eventTypes");
  // },

  getRegistrationTypes() {
    return apiClient.get("/event/types/registrationTypes");
  },
  registerStudents(eventId, studentIds) {
    return apiClient.post(`/event/${eventId}/register`, { studentIds });
  },

  unregisterStudents(eventId, studentIds) {
    return apiClient.delete(`/event/${eventId}/unregister`, {
      data: { studentIds },
    });
  },

  markAttendance(eventId, studentIds) {
    return apiClient.post(`/event/${eventId}/attend`, { studentIds });
  },

  getRegisteredStudents(eventId) {
    return apiClient.get(`/event/${eventId}/registered-students`);
  },

  getAttendingStudents(eventId) {
    return apiClient.get(`/event/${eventId}/attending-students`);
  },

  getRegisteredEventsForStudent(studentId) {
    return apiClient.get(`/event/student/${studentId}/registered-events`);
  },

  getAttendingEventsForStudent(studentId) {
    return apiClient.get(`/event/student/${studentId}/attending-events`);
  },

  getFulfillableFlightPlanItems(eventId, studentId) {
    return apiClient.get(
      `/event/${eventId}/fulfillableFlightPlanItems/${studentId}`,
    );
  },

  getEventsForExperience(experienceId) {
    return apiClient.get(`/event/experience/${experienceId}/fulfilling-events`);
  },

  generateCheckInToken(eventId, expirationTimestamp) {
    return apiClient.post(`/event/${eventId}/check-in-token`, {
      expirationTimestamp,
    });
  },

  getCheckInToken(eventId) {
    return apiClient.get(`/event/${eventId}/check-in-token`);
  },

  checkInWithToken(eventId, studentId, token) {
    return apiClient.post(`/event/${eventId}/check-in/${studentId}`, { token });
  },

  importAttendance(attendanceData) {
    return apiClient.post(`/event/import-attendance`, attendanceData);
  },
  addStrength(eventId, strengthId) {
    return apiClient.put(`/event/${eventId}/strengths`, {
      strengthId,
    });
  },
  removeStrength(eventId, strengthId) {
    return apiClient.delete(`/event/${eventId}/strengths`, {
      data: { strengthId },
    });
  },
  addMajor(eventId, majorId) {
    return apiClient.put(`/event/${eventId}/majors`, {
      majorId,
    });
  },
  removeMajor(eventId, majorId) {
    return apiClient.delete(`/event/${eventId}/majors`, {
      data: { majorId },
    });
  },
};
