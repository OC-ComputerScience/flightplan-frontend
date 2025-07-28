export const required = (input) => (input ? true : "This is a required field");

export const positiveNumber = (input) => {
  const number = Number(input);
  return Number.isInteger(number) && number > 0
    ? true
    : "Must be an integer greater than 0";
};

export const zeroOrGreater = (input) => {
  const number = Number(input);
  return Number.isInteger(number) && number >= 0
    ? true
    : "Must be an integer greater than or equal to 0";
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

export const fromWebsite = (value, websiteRoot) => {
  const urlPattern = /^(https?:\/\/)([\w.-]+)\.([a-z]{2,})(:[0-9]{2,5})?(\/[^\s]*)?\s*$/i;
  if (!websiteRoot) {
    return `Invalid Website`;
  } else if (urlPattern.test(value) === false && websiteRoot !== "None") {
    return `Link must be a valid URL starting with ${websiteRoot}`;
  } else if (urlPattern.test(value) === false) {
    return `Link must be a valid URL starting with http(s)://`
  } else if (!value.startsWith(websiteRoot) && websiteRoot !== "None") {
    return `Link must start with ${websiteRoot}`;
  } else if (!(value.length > websiteRoot.length)) {
    return `Please finish the link with a valid path`;
  } else {
    return true;
  }
};

export const atLeast = (value, min) =>
  value.length >= min ? true : `Must select at least ${min} option(s)`;

export const noGreaterThan = (value, max) =>
  value.length <= max ? true : `Must select no more than ${max} option(s)`;

const getFileExtension = (fileName) => {
  if (!fileName || typeof fileName !== "string") return null;
  const parts = fileName.split(".");
  return parts.length > 1 ? "image/" + parts.pop().toLowerCase() : null;
};

export const characterLimit = (value, min) => {
  if (value.length < min) {
    return `Submission must be at least ${min} characters`;
   } else {
    return true;
  }
}

export const isLink = (value) => {
  const webPattern = /^https?:\/\/w?w?w?\.?[\w.-]+\.[a-z]{2,}(\/[^\s]*)?$/;
  if (!webPattern.test(value))
    return "Link must start with http(s)://www. and end with a valid domain";
  else
    return true
}
