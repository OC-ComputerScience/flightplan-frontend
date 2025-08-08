import apiClient from "./services.js";

export default {
  getAllStudentRewards() {
    return apiClient.get("/studentRewards");
  },
  getAllStudentRewardsForStudent(studentId) {
    return apiClient.get(`/studentRewards/student/${studentId}`);
  },
  getAllStudentRewardsForReward(rewardId) {
    return apiClient.get(`/studentRewards/reward/${rewardId}`);
  },
  getAllStudentRewardsForStudentAndReward(studentId, rewardId) {
    return apiClient.get(
      `/studentRewards/student/${studentId}/reward/${rewardId}`,
    );
  },
};
