import jwt from "jsonwebtoken"
import { prisma } from "../lib/prisma.js"
import { HttpError } from "../lib/httpError.js"
import { toPublicUser } from "../lib/publicUser.js"
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization ?? ""
    const match = /^Bearer (.+)$/.exec(header)
    if (!match) {
      throw new HttpError(401, "Sign in required")
    }
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new HttpError(500, "JWT_SECRET is not configured")
    }
    let payload
    try {
      payload = jwt.verify(match[1], secret)
    } catch {
      throw new HttpError(401, "Sign in required")
    }
    if (!payload || typeof payload !== "object" || typeof payload.sub !== "string") {
      throw new HttpError(401, "Sign in required")
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      throw new HttpError(401, "Sign in required")
    }
    req.user = toPublicUser(user)
    next()
  } catch (error) {
    next(error)
  }
}
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new HttpError(403, "You do not have access to this"))
      return
    }
    next()
  }
}
