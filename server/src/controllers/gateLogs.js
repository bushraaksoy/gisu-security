import {
  GateLogStatus,
  GateLogType,
  Role,
} from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { schoolDayKey, schoolDayOn } from "../lib/schoolDay.js";
import {
  isRecord,
  optionalDate,
  optionalId,
  requiredString,
  routeId,
  withPrisma,
} from "../lib/validate.js";
const gateLogInclude = {
  student: true,
  parent: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
};
const gateLogTypes = new Set(Object.values(GateLogType));
function requiredType(value) {
  if (typeof value !== "string" || !gateLogTypes.has(value)) {
    throw new HttpError(400, "type is invalid");
  }
  return value;
}
function optionalType(value) {
  if (value === undefined) {
    return undefined;
  }
  return requiredType(value);
}
async function localStudentName(studentId) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    throw new HttpError(400, "Student was not found");
  }
  return `${student.givenName} ${student.surname}`;
}
async function assertParent(parentId) {
  if (!parentId) {
    return;
  }
  const parent = await prisma.user.findUnique({ where: { id: parentId } });
  if (!parent) {
    throw new HttpError(400, "Parent was not found");
  }
  if (parent.role !== Role.PARENT) {
    throw new HttpError(400, "Parent must have the PARENT role");
  }
}
export const listGateLogs = async (req, res) => {
  const date = req.query.date;
  const where = { status: { not: GateLogStatus.REJECTED } };
  if (date !== undefined) {
    if (req.user.role === Role.SECURITY) {
      throw new HttpError(403, "You do not have access to this");
    }
    const range = schoolDayOn(date);
    if (!range || date > schoolDayKey()) {
      throw new HttpError(400, "date is invalid");
    }
    where.occurredAt = { gte: range.start, lt: range.end };
  }
  const gateLogs = await prisma.gateLog.findMany({
    where,
    include: gateLogInclude,
    orderBy: { occurredAt: "desc" },
  });
  res.json(gateLogs);
};
export const getGateLog = async (req, res) => {
  const id = routeId(req.params.id);
  const gateLog = await prisma.gateLog.findUnique({
    where: { id },
    include: gateLogInclude,
  });
  if (!gateLog) {
    throw new HttpError(404, "Not found");
  }
  res.json(gateLog);
};
export const createGateLog = async (req, res) => {
  if (!isRecord(req.body)) {
    throw new HttpError(400, "Request body is required");
  }
  const studentId = requiredString(req.body.studentId, "studentId");
  const parentId = optionalId(req.body.parentId, "parentId") ?? null;
  const occurredAt = optionalDate(req.body.occurredAt, "occurredAt");
  const studentName = await localStudentName(studentId);
  await assertParent(parentId);
  const gateLog = await withPrisma(() =>
    prisma.gateLog.create({
      data: {
        type: requiredType(req.body.type),
        status: GateLogStatus.APPROVED,
        studentId,
        studentName,
        parentId,
        occurredAt,
      },
      include: gateLogInclude,
    }),
  );
  res.status(201).json(gateLog);
};
export const updateGateLog = async (req, res) => {
  if (!isRecord(req.body)) {
    throw new HttpError(400, "Request body is required");
  }
  const id = routeId(req.params.id);
  const existing = await prisma.gateLog.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Not found");
  }
  const studentId =
    req.body.studentId === undefined
      ? existing.studentId
      : requiredString(req.body.studentId, "studentId");
  const parentId =
    req.body.parentId === undefined
      ? existing.parentId
      : (optionalId(req.body.parentId, "parentId") ?? null);
  const type = optionalType(req.body.type) ?? existing.type;
  const occurredAt =
    req.body.occurredAt === undefined
      ? existing.occurredAt
      : (optionalDate(req.body.occurredAt, "occurredAt") ??
        existing.occurredAt);
  const studentName =
    req.body.studentId === undefined || !studentId
      ? existing.studentName
      : await localStudentName(studentId);
  await assertParent(parentId);
  const gateLog = await withPrisma(() =>
    prisma.gateLog.update({
      where: { id },
      data: {
        type,
        studentId,
        studentName,
        parentId,
        occurredAt,
      },
      include: gateLogInclude,
    }),
  );
  res.json(gateLog);
};
export const deleteGateLog = async (req, res) => {
  const id = routeId(req.params.id);
  await withPrisma(() => prisma.gateLog.delete({ where: { id } }));
  res.status(204).send();
};
