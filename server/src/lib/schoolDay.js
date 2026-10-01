const timeZone = "Africa/Kampala";
const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
function kampalaParts(now) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return {
    year: parts.find((part) => part.type === "year").value,
    month: parts.find((part) => part.type === "month").value,
    day: parts.find((part) => part.type === "day").value,
  };
}
export function schoolDayKey(now = new Date()) {
  const { year, month, day } = kampalaParts(now);
  return `${year}-${month}-${day}`;
}
function rangeFromKey(key) {
  const start = new Date(`${key}T00:00:00+03:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
export function schoolDayRange(now = new Date()) {
  return rangeFromKey(schoolDayKey(now));
}
export function schoolDayOn(isoDate) {
  if (typeof isoDate !== "string" || !dayPattern.test(isoDate)) {
    return null;
  }
  const start = new Date(`${isoDate}T00:00:00+03:00`);
  if (Number.isNaN(start.getTime()) || schoolDayKey(start) !== isoDate) {
    return null;
  }
  return rangeFromKey(isoDate);
}
