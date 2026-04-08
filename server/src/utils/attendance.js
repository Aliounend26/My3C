export const attendanceWeightMap = {
  present: 1,
  late: 0.75,
  absent: 0
};

export const getCourseStartDateTime = (course) => new Date(`${course.date}T${course.startTime}:00`);

export const getCourseEndDateTime = (course) => new Date(`${course.date}T${course.endTime}:00`);

export const getAttendanceWindow = (course) => {
  const startsAt = getCourseStartDateTime(course);
  const endsAt = getCourseEndDateTime(course);
  const opensAt = new Date(startsAt);
  const closesAt = new Date(endsAt);

  opensAt.setMinutes(opensAt.getMinutes() - 30);
  closesAt.setHours(closesAt.getHours() + 1);

  return {
    opensAt,
    startsAt,
    endsAt,
    closesAt
  };
};

export const getStatusFromScanTime = (course, scannedAt) => {
  const start = getCourseStartDateTime(course);
  const lateThreshold = new Date(start);
  lateThreshold.setMinutes(lateThreshold.getMinutes() + 15);

  return scannedAt > lateThreshold ? "late" : "present";
};

export const getAttendanceHours = (durationHours, status) => {
  const weight = attendanceWeightMap[status] ?? 0;
  return Number((durationHours * weight).toFixed(2));
};

export const calculateAttendanceRate = (presentHours, totalHours) => {
  if (!totalHours) {
    return 0;
  }

  return Number(((presentHours / totalHours) * 100).toFixed(1));
};

export const getAttendanceBand = (rate) => {
  if (rate >= 90) {
    return { label: "Excellent", color: "green" };
  }

  if (rate >= 75) {
    return { label: "Bon", color: "yellow" };
  }

  if (rate >= 50) {
    return { label: "Moyen", color: "orange" };
  }

  return { label: "Faible", color: "red" };
};
