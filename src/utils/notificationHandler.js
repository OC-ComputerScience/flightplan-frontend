import notificationServices from "../services/notificationServices";

export const createNotification = async (header, description, read, userId, sentBy, email) => {
    console.log("I've been called")
    await notificationServices.createNotification({
        header: header,
        description: description,
        read: read,
        userId: userId,
        sentBy: sentBy,
    });

    if (email) {
        // Handle sending emails
    }
}

export const sendEmail = async () => {
    // logic for sending an email
}