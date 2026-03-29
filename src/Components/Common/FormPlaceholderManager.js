import { useEffect } from "react";

const NON_TEXT_INPUT_TYPES = new Set(["checkbox", "radio", "file", "hidden", "submit", "button"]);

const cleanLabel = (text = "") =>
  text
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

const buildPlaceholder = (field, labelText) => {
  const label = cleanLabel(labelText);
  if (!label) return "";

  if (field.tagName === "TEXTAREA") {
    return `Enter ${label.toLowerCase()}`;
  }

  if (field.type === "date" || field.type === "datetime-local" || field.type === "month") {
    return `Select ${label.toLowerCase()}`;
  }

  return `Enter ${label.toLowerCase()}`;
};

const findRelatedLabel = (field) => {
  if (field.id) {
    const escapedId = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(field.id) : field.id;
    const linkedLabel = document.querySelector(`label[for="${escapedId}"]`);
    if (linkedLabel?.textContent) return linkedLabel.textContent;
  }

  const formGroup = field.closest(".form-group, .mb-3, .col, .col-md-6, .col-md-12, .col-lg-6, .col-lg-12");
  const nearbyLabel = formGroup?.querySelector("label, .form-label");
  if (nearbyLabel?.textContent) return nearbyLabel.textContent;

  const previousLabel = field.parentElement?.previousElementSibling;
  if (previousLabel?.matches?.("label, .form-label")) return previousLabel.textContent;

  return "";
};

const applyPlaceholders = () => {
  const fields = document.querySelectorAll("input, textarea");

  fields.forEach((field) => {
    if (field.placeholder) return;
    if (NON_TEXT_INPUT_TYPES.has(field.type)) return;

    const labelText = findRelatedLabel(field);
    const placeholder = buildPlaceholder(field, labelText);
    if (placeholder) {
      field.setAttribute("placeholder", placeholder);
    }
  });
};

const FormPlaceholderManager = () => {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    applyPlaceholders();

    const observer = new MutationObserver(() => {
      applyPlaceholders();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
};

export default FormPlaceholderManager;
