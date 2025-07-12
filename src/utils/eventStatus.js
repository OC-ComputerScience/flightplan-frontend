export const getEventCardColor = (
  event,
  checkedInEvents,
  registeredEvents,
  cancelledEvents,
) => {
  if (checkedInEvents.some((e) => e.id === event.id)) return "checkedin";
  if (cancelledEvents.some((e) => e.id === event.id)) return "canceled";
  if (event.status === "Past") return "passed";
  if (registeredEvents.some((e) => e.id === event.id)) return "registered";
  return "upcoming";
};
