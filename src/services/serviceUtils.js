import Utils from "../config/utils";
function jsonToFormData(json) {
  const formData = new FormData();
  for (const key in json) {
    if (Object.prototype.hasOwnProperty.call(json, key)) {
      formData.append(key, json[key]);
    }
  }
  return formData;
}

function getAuthHeader() {
  let user = Utils.getStore("user");
  if (user != null) {
    let token = user.token;
    let authHeader = "";
    if (token != null && token != "") authHeader = "Bearer " + token;
    return authHeader;
  }
  return "";
}

function getBaseURL() {
  if (import.meta.env.DEV) {
    return "http://localhost:3031/flight-plan-t1";
  } else {
    return "/flight-plan";
  }
}

export { getAuthHeader, jsonToFormData, getBaseURL };
