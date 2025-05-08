export const formatTime = (date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert 0 to 12 AM
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
};

export const parseTimeString = (timeString, date) => {
  if (!timeString) return null;
  const [time, ampm] = timeString.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  const newDate = new Date(date);
  newDate.setHours(hours, minutes);
  return newDate;
};

export const generateTimeOptions = () => {
  const options = [];
  const baseTime = new Date();
  baseTime.setHours(0, 0, 0, 0);
  for (let i = 0; i < 96; i++) {
    const newTime = new Date(baseTime);
    newTime.setMinutes(i * 15);
    options.push(formatTime(newTime));
  }
  return options;
};

export const formatTimeOptions = (value) => {
  if (!value) return "";

  // Split the time into parts
  const [time, ampm] = value.split(" ");
  let [hours, minutes] = time.split(":");

  // Add leading zero to hours if needed
  hours = String(hours).padStart(2, "0");

  // Return the formatted time with AM/PM
  return `${hours}:${minutes} ${ampm.toUpperCase()}`;
};

export const validateTime = (value) => {
  const timePattern = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
  return (
    value === "" ||
    timePattern.test(value) ||
    "Invalid time format (HH:MM AM/PM)"
  );
};

export const validateEndTime = (value, formData) => {
  if (!formData.startTime || !value) return true; // Skip validation if one is missing

  const start = new Date(`01/01/2000 ${formData.startTime}`);
  const end = new Date(`01/01/2000 ${value}`);

  return end > start || "End Time must be after Start Time";
};
