export const isRecommended = (strengths, moreStrengths) => {
  if (!strengths || !moreStrengths) return false;
  const strengthIds = strengths.map((strength) => strength.id);
  const moreStrengthIds = moreStrengths.map((strength) => strength.id);
  return strengthIds.some((strength) => moreStrengthIds.includes(strength));
};
