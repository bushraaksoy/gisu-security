export const roles = ["SUPERADMIN", "ADMIN", "SECURITY", "PARENT"]
export const gateLogTypes = ["DROPOFF", "PICKUP"]
export const roleLabels = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Admin",
  SECURITY: "Security",
  PARENT: "Guardian",
}
export function assignableRoles(actorRole) {
  if (actorRole === "SUPERADMIN") {
    return ["ADMIN", "SECURITY", "PARENT"]
  }
  return ["ADMIN", "PARENT"]
}
export const gateLogTypeLabels = {
  DROPOFF: "Dropoff",
  PICKUP: "Pickup",
}
export function studentName(student) {
  return `${student.givenName} ${student.surname}`
}
export function formatWhen(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
export function toDateTimeLocal(value) {
  const date = new Date(value)
  const pad = (part) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
