export const createInitialMonthDate = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

export const shiftMonth = (monthDate, offset) => new Date(monthDate.getFullYear(), monthDate.getMonth() + offset, 1);

export const toMonthInputValue = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = `${monthDate.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
};

export const fromMonthInputValue = (value) => {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, 1);
};

export const toMonthDateFromDay = (value) => {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, 1);
};
