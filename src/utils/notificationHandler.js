import notificationServices from "../services/notificationServices";
import emailServices from "../services/emailServices";
import { userStore } from "../stores/userStore";

export const createNotification = async (
  header,
  description,
  read,
  userId,
  sentBy,
  email = false,
) => {
  await notificationServices
    .createNotification({
      header: header,
      description: description,
      read: read,
      userId: userId,
      sentBy: sentBy,
    })
    .then(() => {
      if (email) {
        let store = userStore();
        const emailData = {
          to: store.user.email,
          subject: header,
          body: description,
        };
        sendEmail(emailData);
      }
    })
    .catch((err) => {
      console.error("Error creating notification in utils:", err);
    });
};

export const createEventNotification = async (
  event,
  userId,
  isCancel = false,
  email = false,
  sentBy = 1,
) => {
  if (isCancel) {
    await notificationServices
      .createNotification({
        header: `${event.name || "Event"} Event on ${event.date} Cancelled`,
        description: `The event ${event.name || "you registered for"} on ${event.date} you have registed for has been cancelled.`,
        read: false,
        userId: userId,
        sentBy: sentBy,
      })
      .then(() => {
        if (email) {
          let store = userStore();
          const emailData = {
            to: store.user.email,
            subject: `${event.name || "Event"} Event on ${event.date} Cancelled`,
            body: `The event ${event.name || "you registered for"} on ${event.date} you have registed for has been cancelled.`,
          };
          sendEmail(emailData);
        }
      })
      .catch((err) => {
        console.error("Error creating notification in utils:", err);
      });
  } else {
    await notificationServices
      .createNotification({
        header: `${event.name || "Event"} on ${event.date} Event Info Has Changed`,
        description:
          `The event ${event.name || "you have registered for"} has been changed.<br><br>` +
          `<b>Description:</b> ${event.description}<br>` +
          `<b>Location:</b> ${event.location}<br>` +
          `<b>Date:</b> ${event.date}<br>` +
          `<b>Start Time:</b> ${event.startTime}<br>` +
          `<b>End Time:</b> ${event.endTime}`,
        read: false,
        userId: userId,
        sentBy: sentBy,
      })
      .then(() => {
        if (email) {
          let store = userStore();
          const emailData = {
            to: store.user.email,
            subject: `${event.name || "Event"} on ${event.date} Event Info Has Changed`,
            body:
              `The event ${event.name || "you have registered for"} has been changed.<br><br>` +
              `<b>Description:</b> ${event.description}<br>` +
              `<b>Location:</b> ${event.location}<br>` +
              `<b>Date:</b> ${event.date}<br>` +
              `<b>Start Time:</b> ${event.startTime}<br>` +
              `<b>End Time:</b> ${event.endTime}`,
          };
          sendEmail(emailData);
        }
      })
      .catch((err) => {
        console.error("Error creating notification in utils:", err);
      });
  }
};

export const sendEmail = async (emailData) => {
  console.log("Sending test email...");
  try {
    await emailServices.sendEmail(emailData);
    console.log(emailData);
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
};
