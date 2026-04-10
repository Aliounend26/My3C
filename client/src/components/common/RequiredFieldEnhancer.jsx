import { useEffect } from "react";

const shouldDecorateField = (field) => {
  if (!(field instanceof HTMLElement)) {
    return false;
  }

  if (!field.hasAttribute("required")) {
    return false;
  }

  const inputType = field.getAttribute("type");
  return !["checkbox", "radio", "hidden", "file"].includes(inputType || "");
};

const decorateRequiredFields = () => {
  const fields = document.querySelectorAll("input[required], select[required], textarea[required]");

  fields.forEach((field) => {
    if (!shouldDecorateField(field)) {
      return;
    }

    if (field.hasAttribute("placeholder")) {
      const placeholder = field.getAttribute("placeholder") || "";
      if (placeholder && !placeholder.trim().endsWith("*")) {
        field.setAttribute("placeholder", `${placeholder.trim()} *`);
      }
    }

    const parentLabel = field.closest("label");
    if (parentLabel) {
      parentLabel.setAttribute("data-required-label", "true");
    }
  });
};

export const RequiredFieldEnhancer = () => {
  useEffect(() => {
    decorateRequiredFields();

    const observer = new MutationObserver(() => {
      decorateRequiredFields();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  return null;
};
