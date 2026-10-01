import { Prisma } from "../generated/prisma/client.js"
import { HttpError } from "./httpError.js"
export async function withPrisma(action) {
  try {
    return await action()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.join(" ")
          : String(error.meta?.target ?? "")
        if (target.includes("username")) {
          throw new HttpError(409, "Username already in use")
        }
        if (target.includes("guardianId")) {
          throw new HttpError(409, "Guardian is already linked to an account")
        }
        throw new HttpError(409, "Email already in use")
      }
      if (error.code === "P2003") {
        throw new HttpError(409, "Record is still referenced by a gate log")
      }
      if (error.code === "P2025") {
        throw new HttpError(404, "Not found")
      }
    }
    throw error
  }
}
export function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
export function routeId(value) {
  const id = Array.isArray(value) ? value[0] : value
  if (!id) {
    throw new HttpError(400, "id is required")
  }
  return id
}
export function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${field} is required`)
  }
  return value.trim()
}
export function optionalId(value, field) {
  if (value === undefined) {
    return undefined
  }
  if (value === null || value === "") {
    return null
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${field} must be an id`)
  }
  return value.trim()
}
export function idList(value, field) {
  if (value === undefined) {
    return undefined
  }
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string" || item.trim() === "")
  ) {
    throw new HttpError(400, `${field} must be an array of ids`)
  }
  return [...new Set(value.map((item) => item.trim()))]
}
const usernamePattern = /^[a-z0-9][a-z0-9._@+-]*$/
export function requiredUsername(value) {
  const username = requiredString(value, "username").toLowerCase()
  if (
    username.length < 3 ||
    username.length > 64 ||
    !usernamePattern.test(username)
  ) {
    throw new HttpError(400, "username is invalid")
  }
  return username
}
export function usernameFromName(name) {
  const slug = String(name)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean)
    .join(".")
  return slug.length >= 3 ? slug.slice(0, 64) : "user"
}
export function requiredEmail(value) {
  const email = requiredString(value, "email").toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "email is invalid")
  }
  return email
}
export function optionalEmail(value) {
  if (value === undefined) {
    return undefined
  }
  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return null
  }
  return requiredEmail(value)
}
export function optionalDate(value, field) {
  if (value === undefined || value === null || value === "") {
    return undefined
  }
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new HttpError(400, `${field} is invalid`)
  }
  return new Date(value)
}
