import { Router } from "express"
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from "../controllers/users.js"
export const usersRouter = Router()
usersRouter.get("/", listUsers)
usersRouter.post("/", createUser)
usersRouter.get("/:id", getUser)
usersRouter.patch("/:id", updateUser)
usersRouter.delete("/:id", deleteUser)
