import { client } from "@/api/client"
export async function getDirectory() {
  const { data } = await client.get("/directory")
  return data
}
