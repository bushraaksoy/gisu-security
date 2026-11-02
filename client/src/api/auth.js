import { client } from "@/api/client"
export async function login(username, password) {
  const { data } = await client.post("/auth/login", { username, password })
  return data
}
export async function me() {
  const { data } = await client.get("/auth/me")
  return data
}
export async function changePassword(oldPassword, newPassword) {
  const { data } = await client.post("/auth/change-password", {
    oldPassword,
    newPassword,
  })
  return data
}
