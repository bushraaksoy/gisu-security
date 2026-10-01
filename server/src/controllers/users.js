import bcrypt from "bcryptjs"
import { Role } from "../generated/prisma/client.js"
import { prisma } from "../lib/prisma.js"
import { HttpError } from "../lib/httpError.js"
import { loadDirectory } from "../lib/directory.js"
import { toPublicUser } from "../lib/publicUser.js"
import {
  isRecord,
  optionalEmail,
  requiredString,
  requiredUsername,
  routeId,
  usernameFromName,
  withPrisma,
} from "../lib/validate.js"
const userInclude = {
  students: {
    orderBy: [{ surname: "asc" }, { givenName: "asc" }],
  },
}
const roles = new Set(Object.values(Role))
function requiredRole(value) {
  if (typeof value !== "string" || !roles.has(value)) {
    throw new HttpError(400, "role is invalid")
  }
  return value
}
function visibleRoles(actor) {
  if (actor.role === Role.SUPERADMIN) {
    return [Role.ADMIN, Role.PARENT, Role.SECURITY]
  }
  return [Role.ADMIN, Role.PARENT]
}
function assertCanAssign(actor, role) {
  if (role === Role.SUPERADMIN) {
    throw new HttpError(403, "That role cannot be assigned")
  }
  if (actor.role !== Role.SUPERADMIN && role === Role.SECURITY) {
    throw new HttpError(403, "That role cannot be assigned")
  }
}
function canManage(actor, user) {
  return visibleRoles(actor).includes(user.role)
}
function requiredPassword(value) {
  if (typeof value !== "string" || value.length < 8) {
    throw new HttpError(400, "password must be at least 8 characters")
  }
  return value
}
function optionalPassword(value) {
  if (value === undefined || value === null || value === "") {
    return undefined
  }
  return requiredPassword(value)
}
function requiredGuardianId(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, "guardianId is required")
  }
  return value.trim()
}
async function availableUsername(base) {
  let candidate = base
  let suffix = 2
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    const ending = String(suffix)
    candidate = `${base.slice(0, 64 - ending.length)}${ending}`
    suffix += 1
  }
  return candidate
}
function usernameFromBody(value) {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null
  }
  return requiredUsername(value)
}
async function assertGuardianExists(guardianId) {
  const directory = await loadDirectory()
  const found = directory.guardians?.some(
    (guardian) => guardian.id === guardianId
  )
  if (!found) {
    throw new HttpError(400, "Guardian was not found")
  }
}
export const listUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: { in: visibleRoles(req.user) } },
    include: userInclude,
    orderBy: { name: "asc" },
  })
  res.json(users.map(toPublicUser))
}
export const getUser = async (req, res) => {
  const id = routeId(req.params.id)
  const user = await prisma.user.findUnique({
    where: { id },
    include: userInclude,
  })
  if (!user || !canManage(req.user, user)) {
    throw new HttpError(404, "Not found")
  }
  res.json(toPublicUser(user))
}
export const createUser = async (req, res) => {
  if (!isRecord(req.body)) {
    throw new HttpError(400, "Request body is required")
  }
  const name = requiredString(req.body.name, "name")
  const submittedUsername = usernameFromBody(req.body.username)
  const username = submittedUsername
    ? submittedUsername
    : await availableUsername(usernameFromName(name))
  const email = optionalEmail(req.body.email) ?? null
  const role = requiredRole(req.body.role)
  assertCanAssign(req.user, role)
  const passwordHash = await bcrypt.hash(requiredPassword(req.body.password), 10)
  let guardianId = null
  if (role === Role.PARENT) {
    guardianId = requiredGuardianId(req.body.guardianId)
    await assertGuardianExists(guardianId)
  }
  const user = await withPrisma(() =>
    prisma.user.create({
      data: {
        name,
        username,
        email,
        role,
        passwordHash,
        guardianId,
      },
      include: userInclude,
    })
  )
  res.status(201).json(toPublicUser(user))
}
export const updateUser = async (req, res) => {
  if (!isRecord(req.body)) {
    throw new HttpError(400, "Request body is required")
  }
  const id = routeId(req.params.id)
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing || !canManage(req.user, existing)) {
    throw new HttpError(404, "Not found")
  }
  const name =
    req.body.name === undefined
      ? existing.name
      : requiredString(req.body.name, "name")
  const username =
    req.body.username === undefined
      ? existing.username
      : requiredUsername(req.body.username)
  const email =
    req.body.email === undefined
      ? existing.email
      : optionalEmail(req.body.email)
  const role =
    req.body.role === undefined ? existing.role : requiredRole(req.body.role)
  assertCanAssign(req.user, role)
  const password = optionalPassword(req.body.password)
  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined
  let guardianId = existing.guardianId
  if (role !== Role.PARENT) {
    guardianId = null
  } else if (req.body.guardianId !== undefined) {
    guardianId = requiredGuardianId(req.body.guardianId)
  }
  if (role === Role.PARENT && !guardianId) {
    throw new HttpError(400, "guardianId is required")
  }
  if (role === Role.PARENT) {
    await assertGuardianExists(guardianId)
  }
  const user = await withPrisma(() =>
    prisma.user.update({
      where: { id },
      data: {
        name,
        username,
        email,
        role,
        passwordHash,
        guardianId,
        students: role === Role.PARENT ? undefined : { set: [] },
      },
      include: userInclude,
    })
  )
  res.json(toPublicUser(user))
}
export const deleteUser = async (req, res) => {
  const id = routeId(req.params.id)
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing || !canManage(req.user, existing)) {
    throw new HttpError(404, "Not found")
  }
  await withPrisma(() => prisma.user.delete({ where: { id } }))
  res.status(204).send()
}
