export default class Utils {
  // set local storage
  static setStore = (name, content) => {
    if (!name) return;
    if (typeof content !== "string") {
      content = JSON.stringify(content);
    }
    return window.localStorage.setItem(name, content);
  };
  // get local storage
  static getStore = (name) => {
    if (!name) return;
    return JSON.parse(window.localStorage.getItem(name));
  };
  // remove item
  static removeItem = (name) => {
    if (!name) return;
    return window.localStorage.removeItem(name);
  };
}
