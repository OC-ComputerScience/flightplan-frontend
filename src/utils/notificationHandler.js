import notificationServices from "../services/notificationServices";
import emailServices from "../services/emailServices";

export const createNotification = async (
  header,
  description,
  read,
  userId,
  sentBy,
  email = false,
  emailAddress = null,
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
        const emailData = {
          to: emailAddress,
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

export const createEventCancelNotification = async (
  event,
  userId,
  email = false,
  sentBy = null,
  emailAddress = null,
) => {
  let notificationData = {
    header: `${event.name || "Event"} Event on ${event.date} Cancelled`,
    description: `The event ${event.name || "you registered for"} on ${event.date} you have registed for has been cancelled.` +
    `<br><br>` +
    `Keep an eye out on the calendar for more events to register for!` +
    `<br><br>` +
    `-OC Career Services`,
    read: false,
    userId: userId,
    sentBy: sentBy,
  };

  await notificationServices
    .createNotification({
      header: notificationData.header,
      description: notificationData.description,
      read: notificationData.read,
      userId: notificationData.userId,
      sentBy: notificationData.sentBy,
    })
    .then(() => {
      if (email) {
        const emailData = {
          to: emailAddress,
          subject: notificationData.header,
          body: notificationData.description,
        };
        sendEmail(emailData);
      }
    })
    .catch((err) => {
      console.error("Error creating notification in utils:", err);
    });
};

export const createEventUpdateNotification = async (
  event,
  userId,
  email = false,
  sentBy = null,
  emailAddress = null,
) => {
  let notificationData = {
    header: `${event.name || "Event"} on ${event.date} Event Info Has Changed`,
    description:
      `The event ${event.name || "you have registered for"} has been changed.<br><br>` +
      `<b>Description:</b> ${event.description}<br>` +
      `<b>Location:</b> ${event.location}<br>` +
      `<b>Date:</b> ${event.date}<br>` +
      `<b>Start Time:</b> ${event.startTime}<br>` +
      `<b>End Time:</b> ${event.endTime}` +
      `<br><br>` +
      `-OC Career Services`,
    read: false,
    userId: userId,
    sentBy: sentBy,
  };

  await notificationServices
    .createNotification({
      header: notificationData.header,
      description: notificationData.description,
      read: notificationData.read,
      userId: notificationData.userId,
      sentBy: notificationData.sentBy,
    })
    .then(() => {
      if (email) {
        const emailData = {
          to: emailAddress,
          subject: notificationData.header,
          body: notificationData.description,
        };
        sendEmail(emailData);
      }
    })
    .catch((err) => {
      console.error("Error creating notification in utils:", err);
    });
};

export const sendEmail = async (emailData) => {
  try {
    await emailServices.sendEmail(emailData);
    
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
};
