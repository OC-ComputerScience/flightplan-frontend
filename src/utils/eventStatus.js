import { isRecommended } from "./recommended";

export const getEventCardColor = (
  event,
  checkedInEvents,
  registeredEvents,
  cancelledEvents,
  studentStrengths = [],
  eventStrengths = [],
) => {
  if (checkedInEvents.some((e) => e.id === event.id)) return "checkedin";
  if (cancelledEvents.some((e) => e.id === event.id)) return "canceled";
  if (event.status === "Past") return "past";
  if (registeredEvents.some((e) => e.id === event.id)) return "registered";
  if (isRecommended(studentStrengths, eventStrengths)) return "recommended";
  return "upcoming";
};
