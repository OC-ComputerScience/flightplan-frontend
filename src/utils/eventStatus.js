export const getEventCardColor = (
  event,
  checkedInEvents,
  registeredEvents,
  cancelledEvents,
) => {
  if (event.status === "Completed") return "passed";
  if (cancelledEvents.some((e) => e.id === event.id)) return "canceled";
  if (checkedInEvents.some((e) => e.id === event.id)) return "checkedin";
  if (registeredEvents.some((e) => e.id === event.id)) return "registered";
  return "upcoming";
};
