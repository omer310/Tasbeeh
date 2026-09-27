export function calendarWeekday(value) {
  const [day, month, year] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
export function shiftCalendarMonth(date, offset) { return new Date(date.getFullYear(), date.getMonth() + offset, 1); }
