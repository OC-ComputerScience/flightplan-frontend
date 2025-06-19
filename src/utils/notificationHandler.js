import notificationServices from "../services/notificationServices";

export const createNotification = async (
  header,
  description,
  read,
  userId,
  sentBy,
  email,
) => {
  await notificationServices
    .createNotification({
      header: header,
      description: description,
      read: read,
      userId: userId,
      sentBy: sentBy,
    })
    .catch((err) => {
      console.error("Error creating notification in utils:", err.respose);
    });

  if (email) {
    // Handle sending emails
  }
};

export const sendEmail = async () => {
  // logic for sending an email
};
