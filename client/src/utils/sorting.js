export const sortRows = (rows, sorter) => {
  const list = [...rows];

  switch (sorter) {
    case "name-asc":
      return list.sort((a, b) => `${a.firstName || ""} ${a.lastName || ""}`.localeCompare(`${b.firstName || ""} ${b.lastName || ""}`, "fr"));
    case "name-desc":
      return list.sort((a, b) => `${b.firstName || ""} ${b.lastName || ""}`.localeCompare(`${a.firstName || ""} ${a.lastName || ""}`, "fr"));
    case "title-asc":
      return list.sort((a, b) => (a.title || a.name || "").localeCompare(b.title || b.name || "", "fr"));
    case "title-desc":
      return list.sort((a, b) => (b.title || b.name || "").localeCompare(a.title || a.name || "", "fr"));
    case "formation-asc":
      return list.sort((a, b) => (a.formation?.name || "").localeCompare(b.formation?.name || "", "fr"));
    case "formation-desc":
      return list.sort((a, b) => (b.formation?.name || "").localeCompare(a.formation?.name || "", "fr"));
    case "date-asc":
      return list.sort((a, b) => `${a.date || a.course?.date || ""} ${a.startTime || ""}`.localeCompare(`${b.date || b.course?.date || ""} ${b.startTime || ""}`));
    case "date-desc":
      return list.sort((a, b) => `${b.date || b.course?.date || ""} ${b.startTime || ""}`.localeCompare(`${a.date || a.course?.date || ""} ${a.startTime || ""}`));
    case "status-asc":
      return list.sort((a, b) => (a.status || "").localeCompare(b.status || "", "fr"));
    case "status-desc":
      return list.sort((a, b) => (b.status || "").localeCompare(a.status || "", "fr"));
    case "hours-asc":
      return list.sort((a, b) => (a.totalHours || a.presenceHours || 0) - (b.totalHours || b.presenceHours || 0));
    case "hours-desc":
      return list.sort((a, b) => (b.totalHours || b.presenceHours || 0) - (a.totalHours || a.presenceHours || 0));
    case "created-desc":
      return list.sort((a, b) => new Date(b.createdAt || b.scannedAt || 0) - new Date(a.createdAt || a.scannedAt || 0));
    case "created-asc":
      return list.sort((a, b) => new Date(a.createdAt || a.scannedAt || 0) - new Date(b.createdAt || b.scannedAt || 0));
    default:
      return list;
  }
};
