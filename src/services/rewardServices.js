import apiClient from "./services.js";
import axios from "axios";
import { getAuthHeader, jsonToFormData, getBaseURL } from "./serviceUtils.js";
export default {
  getAllRewards(page, pageSize, searchQuery, filters = {}) {
    return apiClient.get("/reward", {
      params: {
        page: page,
        pageSize: pageSize,
        searchQuery: searchQuery,
        redemptionType: filters?.redemptionType,
        sortAttribute: filters?.sortAttribute,
        sortDirection: filters?.sortDirection,
      },
    });
  },
  deleteReward(rewardId) {
    return apiClient.delete(`/reward/${rewardId}`);
  },
  getReward(rewardId) {
    return apiClient.get(`/reward/${rewardId}`);
  },
  createReward(rewardData) {
    return apiClient.post("/reward", rewardData);
  },
  uploadRewardImage(rewardData) {
    const authHeader = getAuthHeader();
    const formData = jsonToFormData(rewardData);
    const baseURL = getBaseURL();
    return axios.post(`${baseURL}/reward/upload`, formData, {
      headers: { Authorization: authHeader },
    });
  },
  deleteRewardImage(fileName) {
    return apiClient.delete(`/reward/image/${fileName}`);
  },
  getRewardImage(fileName) {
    return apiClient.get(`/reward/image/${fileName}`);
  },
  updateReward(rewardId, rewardData) {
    return apiClient.put(`/reward/${rewardId}`, rewardData);
  },
  redeemReward(rewardId, studentId, userId) {
    return apiClient.post(`/reward/redeem/${rewardId}`, {
      studentId,
      userId,
    });
  },
};
