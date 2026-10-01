import { client } from "@/api/client"
export async function listGateLogs(date) {
  const { data } = await client.get("/gate-logs", {
    params: date ? { date } : undefined,
  })
  return data
}
export async function createGateLog(payload) {
  const { data } = await client.post("/gate-logs", payload)
  return data
}
export async function updateGateLog(id, payload) {
  const { data } = await client.patch(`/gate-logs/${id}`, payload)
  return data
}
export async function deleteGateLog(id) {
  const { data } = await client.delete(`/gate-logs/${id}`)
  return data
}
