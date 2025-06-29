import notificationServices from "../services/notificationServices";

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
    .catch((err) => {
      console.error("Error creating notification in utils:", err.respose);
    });

  if (email) {
    // Handle sending emails
  }
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
      .catch((err) => {
        console.error("Error creating notification in utils:", err.respose);
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
      .catch((err) => {
        console.error("Error creating notification in utils:", err.respose);
      });
  }
};

export const sendEmail = async () => {
  // logic for sending an email
};
