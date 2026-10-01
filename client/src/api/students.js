import { client } from "@/api/client"
export async function listStudents() {
  const { data } = await client.get("/students")
  return data
}
