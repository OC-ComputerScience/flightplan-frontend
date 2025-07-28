import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "br", "em", "strong", "a"],
    ALLOWED_ATTR: ["href"],
  });
}
