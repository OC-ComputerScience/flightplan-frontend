import apiClient from "./services";
import { getAuthHeader, jsonToFormData, getBaseURL } from "./serviceUtils.js";
import axios from "axios";

export default {
  uploadFile(fileData, folder) {
   
    const authHeader = getAuthHeader();
    const formData = jsonToFormData(fileData);
    const baseURL = getBaseURL();
   
    return axios.post(
      `${baseURL}/file/upload${folder ? "?folder=submissions" : ""}`,
      formData,
      {
        headers: { Authorization: authHeader },
      },
    );
  },
  getFileForName(fileName) {
    return apiClient.get(`/file/${fileName}`);
  },
  deleteFileForName(fileName) {
    return apiClient.delete(`/file/${fileName}`);
  },
};
