const timeZone = "Africa/Kampala"
const gateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})
const schoolHour = new Intl.DateTimeFormat("en-GB", {
  timeZone,
  hour: "numeric",
  hourCycle: "h23",
})
const schoolDate = new Intl.DateTimeFormat("en-CA", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})
export function formatGateTime(value) {
  return gateTime.format(new Date(value))
}
export function schoolDayKey(value = new Date()) {
  return schoolDate.format(new Date(value))
}
export function isSchoolToday(value) {
  return schoolDayKey(value) === schoolDayKey()
}
export function dayPart(value = new Date()) {
  const hour = Number(schoolHour.format(value))
  if (hour >= 5 && hour < 12) {
    return "morning"
  }
  if (hour >= 12 && hour < 17) {
    return "afternoon"
  }
  return "evening"
}
export function dayGreeting(value = new Date()) {
  const part = dayPart(value)
  if (part === "morning") {
    return "Good Morning!"
  }
  if (part === "afternoon") {
    return "Good Afternoon!"
  }
  return "Good evening!"
}
