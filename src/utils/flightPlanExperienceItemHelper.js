import flightPlanItemServices from "../services/flightPlanItemServices";

export const createOptionalFlightPlanExperience = async (
  event,
  experience,
  currentFlightPlan,
) => {
  const optionalFlightPlanExperienceData = {
    flightPlanItemType: "Experience",
    status: "Incomplete",
    name: `Credit for optional event (${event.name})`,
    optional: true,
    flightPlanId: currentFlightPlan.id,
    experienceId: experience.id,
  };
  return (
    await flightPlanItemServices.createFlightPlanItem(
      optionalFlightPlanExperienceData,
    )
  ).data;
};
