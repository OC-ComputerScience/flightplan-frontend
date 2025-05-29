export const getEventCardColor = (event, checkedInEvents, registeredEvents) => {
  if (checkedInEvents.some((e) => e.id === event.id)) return "success";
  if (registeredEvents.some((e) => e.id === event.id)) return "warning";
  return "primary";
};
