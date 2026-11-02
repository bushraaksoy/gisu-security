import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "../lib/prisma.js"
import { HttpError } from "../lib/httpError.js"
import { toPublicUser } from "../lib/publicUser.js"
import { isRecord, requiredString, requiredUsername } from "../lib/validate.js"
const tokenLifetime = "7d"
function signToken(userId) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new HttpError(500, "JWT_SECRET is not configured")
  }
  return jwt.sign({ sub: userId }, secret, { expiresIn: tokenLifetime })
}
function requiredPassword(value, label = "password") {
  if (typeof value !== "string" || value.length < 8) {
    throw new HttpError(400, `${label} must be at least 8 characters`)
  }
  return value
}
export const login = async (req, res) => {
  if (!isRecord(req.body)) {
    throw new HttpError(400, "Request body is required")
  }
  const username = requiredUsername(req.body.username)
  const password = requiredString(req.body.password, "password")
  const user = await prisma.user.findUnique({ where: { username } })
  const matches =
    user && (await bcrypt.compare(password, user.passwordHash))
  if (!user || !matches) {
    throw new HttpError(401, "Username or password is incorrect")
  }
  res.json({ token: signToken(user.id), user: toPublicUser(user) })
}
export const me = async (req, res) => {
  res.json(req.user)
}
export const changePassword = async (req, res) => {
  if (!isRecord(req.body)) {
    throw new HttpError(400, "Request body is required")
  }
  if (req.user.role === "SECURITY" || req.user.role === "DISPLAY") {
    throw new HttpError(403, "This account cannot change its password")
  }
  const oldPassword = requiredString(req.body.oldPassword, "oldPassword")
  const newPassword = requiredPassword(req.body.newPassword, "newPassword")
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) {
    throw new HttpError(401, "Sign in required")
  }
  const matches = await bcrypt.compare(oldPassword, user.passwordHash)
  if (!matches) {
    throw new HttpError(401, "Current password is incorrect")
  }
  const passwordHash = await bcrypt.hash(newPassword, 10)
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  })
  res.json(toPublicUser(updated))
}
