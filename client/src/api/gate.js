import { client } from "@/api/client"
export async function listAllowedStudents() {
  const { data } = await client.get("/gate/allowed")
  return data
}
export async function listGatePermissions() {
  const { data } = await client.get("/gate/permissions")
  return data
}
export async function lookupParent(username) {
  const { data } = await client.post("/gate/permissions/lookup", { username })
  return data
}
export async function saveGatePermission(payload) {
  const { data } = await client.put("/gate/permissions", payload)
  return data
}
export async function getGateToday() {
  const { data } = await client.get("/gate/today")
  return data
}
export async function dropoffStudents(studentIds) {
  const { data } = await client.post("/gate/dropoff", { studentIds })
  return data
}
export async function pickupStudents(dropoffIds) {
  const { data } = await client.post("/gate/pickup", { dropoffIds })
  return data
}
export async function getPresent() {
  const { data } = await client.get("/gate/present")
  return data
}
export async function approveGateLog(id, transport) {
  const { data } = await client.post(`/gate-logs/${id}/approve`, { transport })
  return data
}
export async function rejectGateLog(id) {
  const { data } = await client.post(`/gate-logs/${id}/reject`)
  return data
}
export async function approveVisit(visitId, transport) {
  const { data } = await client.post(`/gate-visits/${visitId}/approve`, {
    transport,
  })
  return data
}
export async function rejectVisit(visitId) {
  const { data } = await client.post(`/gate-visits/${visitId}/reject`)
  return data
}
export async function searchGateStudents(query) {
  const { data } = await client.get("/gate/students", { params: { q: query } })
  return data
}
export async function recordGateVisit(payload) {
  const { data } = await client.post("/gate/record", payload)
  return data
}
