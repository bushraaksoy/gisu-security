import { Router } from "express"
import { changePassword, login, me } from "../controllers/auth.js"
import { requireAuth } from "../middleware/requireAuth.js"
export const authRouter = Router()
authRouter.post("/login", login)
authRouter.get("/me", requireAuth, me)
authRouter.post("/change-password", requireAuth, changePassword)
