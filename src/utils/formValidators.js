export const required = (input) => (input ? true : "This is a required field");

export const positiveNumber = (input) => {
  const number = Number(input);
  return Number.isInteger(number) && number > 0
    ? true
    : "Must be an integer greater than 0";
};

export const fileTypeRule = (value) => {
  if (!value || !value.length) return true; // Allow empty input
  const fileExtension = getFileExtension(value[0].name);
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  return (
    allowedTypes.includes(value[0].type) ||
    allowedTypes.includes(fileExtension) ||
    "Only PNG, JPG, WEBP, and JPEG files are allowed."
  );
};

export const atLeast = (value, min) =>
  value.length >= min ? true : `Must select at least ${min} option(s)`;

const getFileExtension = (fileName) => {
  if (!fileName || typeof fileName !== "string") return null;
  const parts = fileName.split(".");
  return parts.length > 1 ? "image/" + parts.pop().toLowerCase() : null;
};
