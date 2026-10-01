import { HttpError } from "./httpError.js"
let directoryCache = null
export async function loadDirectory() {
  if (directoryCache && Date.now() - directoryCache.at < 30_000) {
    return directoryCache.data
  }
  const token = process.env.SIS_INTERNAL_TOKEN
  if (!token) {
    throw new HttpError(500, "SIS_INTERNAL_TOKEN is not configured")
  }
  const baseUrl = process.env.SIS_API_URL ?? "http://127.0.0.1:4000"
  const url = new URL("/api/internal/directory", baseUrl)
  let response
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new HttpError(502, "Could not reach the school directory")
  }
  if (!response.ok) {
    throw new HttpError(502, "Could not load the school directory")
  }
  const data = await response.json()
  directoryCache = { at: Date.now(), data }
  return data
}
export function directoryForGuardian(directory, guardianId) {
  const studentIds = new Set(
    directory.links
      .filter((link) => link.guardianId === guardianId)
      .map((link) => link.studentId)
  )
  const links = directory.links.filter((link) => studentIds.has(link.studentId))
  const guardianIds = new Set(links.map((link) => link.guardianId))
  return {
    students: directory.students.filter((student) => studentIds.has(student.id)),
    guardians: directory.guardians.filter((guardian) =>
      guardianIds.has(guardian.id)
    ),
    links,
  }
}
