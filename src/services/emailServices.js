import apiClient from "./services";

export default {
  sendEmail(emailData) {
    return apiClient.post(`/email/send-notification`, emailData);
  },
};
