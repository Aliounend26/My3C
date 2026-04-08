export const courseTypeOptions = [
  { value: "presentiel", label: "Presentiel (Lieu 3C)" },
  { value: "en_ligne", label: "En ligne" }
];

export const getCourseTypeLabel = (course) => {
  if (course?.courseType === "en_ligne") {
    return "En ligne";
  }

  return "Presentiel (Lieu 3C)";
};
