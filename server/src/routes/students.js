import { Router } from "express"
import {
  createStudent,
  deleteStudent,
  getStudent,
  listStudents,
  updateStudent,
} from "../controllers/students.js"
export const studentsRouter = Router()
studentsRouter.get("/", listStudents)
studentsRouter.post("/", createStudent)
studentsRouter.get("/:id", getStudent)
studentsRouter.patch("/:id", updateStudent)
studentsRouter.delete("/:id", deleteStudent)
