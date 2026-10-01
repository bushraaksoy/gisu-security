import { prisma } from "../lib/prisma.js"
import { HttpError } from "../lib/httpError.js"
import {
  isRecord,
  requiredString,
  routeId,
  withPrisma,
} from "../lib/validate.js"
export const listStudents = async (_req, res) => {
  const students = await prisma.student.findMany({
    orderBy: [{ surname: "asc" }, { givenName: "asc" }],
  })
  res.json(students)
}
export const getStudent = async (req, res) => {
  const id = routeId(req.params.id)
  const student = await prisma.student.findUnique({ where: { id } })
  if (!student) {
    throw new HttpError(404, "Not found")
  }
  res.json(student)
}
export const createStudent = async (req, res) => {
  if (!isRecord(req.body)) {
    throw new HttpError(400, "Request body is required")
  }
  const student = await prisma.student.create({
    data: {
      givenName: requiredString(req.body.givenName, "givenName"),
      surname: requiredString(req.body.surname, "surname"),
    },
  })
  res.status(201).json(student)
}
export const updateStudent = async (req, res) => {
  if (!isRecord(req.body)) {
    throw new HttpError(400, "Request body is required")
  }
  const id = routeId(req.params.id)
  const existing = await prisma.student.findUnique({ where: { id } })
  if (!existing) {
    throw new HttpError(404, "Not found")
  }
  const student = await withPrisma(() =>
    prisma.student.update({
      where: { id },
      data: {
        givenName:
          req.body.givenName === undefined
            ? existing.givenName
            : requiredString(req.body.givenName, "givenName"),
        surname:
          req.body.surname === undefined
            ? existing.surname
            : requiredString(req.body.surname, "surname"),
      },
    })
  )
  res.json(student)
}
export const deleteStudent = async (req, res) => {
  const id = routeId(req.params.id)
  await withPrisma(() => prisma.student.delete({ where: { id } }))
  res.status(204).send()
}
