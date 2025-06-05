export const getEventCardColor = (
  event,
  checkedInEvents,
  registeredEvents,
  cancelledEvents,
) => {
  console.log("Cancelled Events:", cancelledEvents);
  if (cancelledEvents.includes(event.id)) return "grey";
  if (checkedInEvents.some((e) => e.id === event.id)) return "success";
  if (registeredEvents.some((e) => e.id === event.id)) return "warning";
  return "primary";
};
