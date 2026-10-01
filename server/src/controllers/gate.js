import { randomUUID } from "node:crypto"
import {
  GateLogStatus,
  GateLogType,
  Role,
  Transport,
} from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { directoryForGuardian, loadDirectory } from "../lib/directory.js";
import { schoolDayRange } from "../lib/schoolDay.js";
import {
  idList,
  isRecord,
  requiredString,
  requiredUsername,
  routeId,
} from "../lib/validate.js";
const transports = new Set(Object.values(Transport));
function requiredTransport(value) {
  if (typeof value !== "string" || !transports.has(value)) {
    throw new HttpError(400, "transport is invalid");
  }
  return value;
}
function studentName(student) {
  return [student.givenName, student.middleName, student.surname]
    .filter((part) => part && part.trim() !== "")
    .join(" ");
}
function classLabel(student) {
  return student.classLabel || student.yearGroup || null;
}
async function ownStudents(user) {
  if (user.role !== Role.PARENT) {
    throw new HttpError(403, "You do not have access to this");
  }
  if (!user.guardianId) {
    return [];
  }
  const directory = await loadDirectory();
  return directoryForGuardian(directory, user.guardianId).students;
}
function requiredFlag(value, field) {
  if (typeof value !== "boolean") {
    throw new HttpError(400, `${field} is invalid`);
  }
  return value;
}
async function accessibleStudents(user) {
  const own = await ownStudents(user);
  const directory = await loadDirectory();
  const permissions = await prisma.gatePermission.findMany({
    where: {
      granteeId: user.id,
      OR: [{ canDropoff: true }, { canPickup: true }],
    },
  });
  const byId = new Map();
  for (const student of own) {
    byId.set(student.id, {
      student,
      own: true,
      canDropoff: true,
      canPickup: true,
    });
  }
  for (const permission of permissions) {
    if (byId.has(permission.sisStudentId)) {
      continue;
    }
    const student = directory.students.find(
      (item) => item.id === permission.sisStudentId,
    );
    if (!student) {
      continue;
    }
    byId.set(student.id, {
      student,
      own: false,
      canDropoff: permission.canDropoff,
      canPickup: permission.canPickup,
    });
  }
  return [...byId.values()];
}
function openDropoff(dropoff) {
  const pickedUp = dropoff.pickups.some(
    (pickup) => pickup.status === GateLogStatus.APPROVED,
  );
  return (
    dropoff.status === GateLogStatus.PENDING ||
    (dropoff.status === GateLogStatus.APPROVED && !pickedUp)
  );
}
function childState(dropoff, pickup) {
  if (!dropoff) {
    return "none";
  }
  if (pickup?.status === GateLogStatus.APPROVED) {
    return "picked-up";
  }
  if (
    pickup?.status === GateLogStatus.PENDING ||
    dropoff.status === GateLogStatus.PENDING
  ) {
    return "waiting";
  }
  if (dropoff.status === GateLogStatus.APPROVED) {
    return "at-school";
  }
  if (dropoff.status === GateLogStatus.REJECTED) {
    return "rejected";
  }
  return "none";
}
async function todayVisits(studentIds) {
  const { start, end } = schoolDayRange();
  const dropoffs = await prisma.gateLog.findMany({
    where: {
      type: GateLogType.DROPOFF,
      sisStudentId: { in: studentIds },
      occurredAt: { gte: start, lt: end },
    },
    include: { pickups: true },
    orderBy: { occurredAt: "desc" },
  });
  const byStudent = new Map();
  for (const dropoff of dropoffs) {
    const list = byStudent.get(dropoff.sisStudentId) ?? [];
    list.push(dropoff);
    byStudent.set(dropoff.sisStudentId, list);
  }
  return byStudent;
}
function actedToday(userId, dropoffs) {
  if (!dropoffs) {
    return false;
  }
  return dropoffs.some(
    (dropoff) =>
      dropoff.parentId === userId ||
      dropoff.pickups.some((pickup) => pickup.parentId === userId),
  );
}
function visitFor(dropoffs) {
  const dropoff = dropoffs?.[0] ?? null;
  if (!dropoff) {
    return { dropoff: null, pickup: null };
  }
  const pickup =
    [...dropoff.pickups]
      .sort((a, b) => b.occurredAt - a.occurredAt)
      .find(
        (item) =>
          item.status === GateLogStatus.PENDING ||
          item.status === GateLogStatus.APPROVED,
      ) ?? null;
  return { dropoff, pickup };
}
export const today = async (req, res) => {
  const access = await accessibleStudents(req.user);
  const visits = await todayVisits(
    access.map((item) => item.student.id),
  );
  const children = access
    .map((item) => {
      const logs = visits.get(item.student.id);
      const { dropoff, pickup } = visitFor(logs);
      return {
        id: item.student.id,
        name: studentName(item.student),
        classLabel: classLabel(item.student),
        state: childState(dropoff, pickup),
        dropoffId: dropoff?.id ?? null,
        own: item.own,
        acted: actedToday(req.user.id, logs),
        canDropoff: item.canDropoff,
        canPickup: item.canPickup,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  res.json({ children });
};
export const dropoff = async (req, res) => {
  if (!isRecord(req.body)) {
    throw new HttpError(400, "Request body is required");
  }
  const studentIds = idList(req.body.studentIds, "studentIds");
  if (!studentIds?.length) {
    throw new HttpError(400, "Choose at least one student");
  }
  const access = await accessibleStudents(req.user);
  const byId = new Map(
    access
      .filter((item) => item.canDropoff)
      .map((item) => [item.student.id, item.student]),
  );
  const visits = await todayVisits(studentIds);
  for (const studentId of studentIds) {
    const student = byId.get(studentId);
    if (!student) {
      throw new HttpError(400, "Student was not found");
    }
    const { dropoff: current } = visitFor(visits.get(studentId));
    if (current && openDropoff(current)) {
      throw new HttpError(
        409,
        `${studentName(student)} is already at the gate today`,
      );
    }
  }
  const visitId = randomUUID();
  const logs = await prisma.$transaction(
    studentIds.map((studentId) => {
      const student = byId.get(studentId);
      return prisma.gateLog.create({
        data: {
          type: GateLogType.DROPOFF,
          status: GateLogStatus.PENDING,
          sisStudentId: studentId,
          studentName: studentName(student),
          classLabel: classLabel(student),
          parentId: req.user.id,
          visitId,
        },
      });
    }),
  );
  res.status(201).json(logs);
};
export const pickup = async (req, res) => {
  if (!isRecord(req.body)) {
    throw new HttpError(400, "Request body is required");
  }
  const dropoffIds = idList(req.body.dropoffIds, "dropoffIds");
  if (!dropoffIds?.length) {
    throw new HttpError(400, "Choose at least one student");
  }
  const access = await accessibleStudents(req.user);
  const allowed = new Set(
    access
      .filter((item) => item.canPickup)
      .map((item) => item.student.id),
  );
  const { start, end } = schoolDayRange();
  const dropoffs = await prisma.gateLog.findMany({
    where: { id: { in: dropoffIds } },
    include: { pickups: true },
  });
  const byId = new Map(dropoffs.map((log) => [log.id, log]));
  for (const dropoffId of dropoffIds) {
    const log = byId.get(dropoffId);
    const name = log?.studentName ?? "Student";
    if (
      !log ||
      log.type !== GateLogType.DROPOFF ||
      !log.sisStudentId ||
      !allowed.has(log.sisStudentId)
    ) {
      throw new HttpError(404, "Not found");
    }
    if (
      log.status !== GateLogStatus.APPROVED ||
      log.occurredAt < start ||
      log.occurredAt >= end
    ) {
      throw new HttpError(409, `${name} is not at school`);
    }
    const busy = log.pickups.some(
      (item) =>
        item.status === GateLogStatus.PENDING ||
        item.status === GateLogStatus.APPROVED,
    );
    if (busy) {
      throw new HttpError(409, `${name} is already being picked up`);
    }
  }
  const visitId = randomUUID();
  const logs = await prisma.$transaction(
    dropoffIds.map((dropoffId) => {
      const log = byId.get(dropoffId);
      return prisma.gateLog.create({
        data: {
          type: GateLogType.PICKUP,
          status: GateLogStatus.PENDING,
          sisStudentId: log.sisStudentId,
          studentName: log.studentName,
          classLabel: log.classLabel,
          parentId: req.user.id,
          dropoffId,
          visitId,
        },
      });
    }),
  );
  res.status(201).json(logs);
};
export const listPermissions = async (req, res) => {
  const students = await ownStudents(req.user);
  const rows = await prisma.gatePermission.findMany({
    where: { sisStudentId: { in: students.map((student) => student.id) } },
    include: { grantee: { select: { id: true, name: true } } },
  });
  const byGrantee = new Map();
  for (const row of rows) {
    const current = byGrantee.get(row.granteeId) ?? {
      id: row.granteeId,
      granteeId: row.grantee.id,
      name: row.grantee.name,
      canDropoff: false,
      canPickup: false,
    };
    current.canDropoff = current.canDropoff || row.canDropoff;
    current.canPickup = current.canPickup || row.canPickup;
    byGrantee.set(row.granteeId, current);
  }
  res.json(
    [...byGrantee.values()].sort((a, b) => a.name.localeCompare(b.name)),
  );
};
export const listAllowed = async (req, res) => {
  const ownIds = new Set((await ownStudents(req.user)).map((student) => student.id));
  const access = await accessibleStudents(req.user);
  const students = access
    .filter((item) => !ownIds.has(item.student.id))
    .map((item) => ({
      id: item.student.id,
      name: studentName(item.student),
      classLabel: classLabel(item.student),
      canDropoff: item.canDropoff,
      canPickup: item.canPickup,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  res.json(students);
};
export const lookupParent = async (req, res) => {
  if (req.user.role !== Role.PARENT) {
    throw new HttpError(403, "You do not have access to this");
  }
  if (!isRecord(req.body)) {
    throw new HttpError(400, "Request body is required");
  }
  const username = requiredUsername(req.body.username);
  const user = await prisma.user.findUnique({ where: { username } });
  if (user && user.id === req.user.id) {
    throw new HttpError(400, "You already collect this child");
  }
  if (!user || user.role !== Role.PARENT) {
    throw new HttpError(404, "No parent account uses that sign-in name");
  }
  res.json({ id: user.id, name: user.name });
};
export const savePermission = async (req, res) => {
  if (!isRecord(req.body)) {
    throw new HttpError(400, "Request body is required");
  }
  const granteeId = requiredString(req.body.granteeId, "granteeId");
  const canDropoff = requiredFlag(req.body.canDropoff, "canDropoff");
  const canPickup = requiredFlag(req.body.canPickup, "canPickup");
  const students = await ownStudents(req.user);
  if (!students.length) {
    throw new HttpError(400, "No students are linked to this account");
  }
  if (granteeId === req.user.id) {
    throw new HttpError(400, "You already collect this child");
  }
  const grantee = await prisma.user.findUnique({ where: { id: granteeId } });
  if (!grantee || grantee.role !== Role.PARENT) {
    throw new HttpError(400, "Parent was not found");
  }
  const studentIds = students.map((student) => student.id);
  if (!canDropoff && !canPickup) {
    await prisma.gatePermission.deleteMany({
      where: { sisStudentId: { in: studentIds }, granteeId },
    });
    res.status(204).end();
    return;
  }
  await prisma.$transaction(
    studentIds.map((sisStudentId) =>
      prisma.gatePermission.upsert({
        where: {
          sisStudentId_granteeId: { sisStudentId, granteeId },
        },
        create: {
          sisStudentId,
          grantedById: req.user.id,
          granteeId,
          canDropoff,
          canPickup,
        },
        update: {
          grantedById: req.user.id,
          canDropoff,
          canPickup,
        },
      }),
    ),
  );
  res.json({
    id: granteeId,
    granteeId,
    name: grantee.name,
    canDropoff,
    canPickup,
  });
};
function decisionData(req, status) {
  const data = {
    status,
    reviewedById: req.user.id,
    reviewedAt: new Date(),
  };
  if (status === GateLogStatus.APPROVED) {
    if (!isRecord(req.body)) {
      throw new HttpError(400, "Request body is required");
    }
    data.transport = requiredTransport(req.body.transport);
  }
  return data;
}
async function decide(req, res, status) {
  const id = routeId(req.params.id);
  const existing = await prisma.gateLog.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Not found");
  }
  if (existing.status !== GateLogStatus.PENDING) {
    throw new HttpError(409, "This log is already decided");
  }
  const gateLog = await prisma.gateLog.update({
    where: { id },
    data: decisionData(req, status),
  });
  res.json(gateLog);
}
export const approveGateLog = (req, res) =>
  decide(req, res, GateLogStatus.APPROVED);
export const rejectGateLog = (req, res) =>
  decide(req, res, GateLogStatus.REJECTED);
async function decideVisit(req, res, status) {
  const visitId = routeId(req.params.visitId);
  const logs = await prisma.gateLog.findMany({ where: { visitId } });
  if (!logs.length) {
    throw new HttpError(404, "Not found");
  }
  if (logs.some((log) => log.status !== GateLogStatus.PENDING)) {
    throw new HttpError(409, "This log is already decided");
  }
  await prisma.gateLog.updateMany({
    where: { visitId },
    data: decisionData(req, status),
  });
  const updated = await prisma.gateLog.findMany({ where: { visitId } });
  res.json(updated);
}
export const approveVisit = (req, res) =>
  decideVisit(req, res, GateLogStatus.APPROVED);
export const rejectVisit = (req, res) =>
  decideVisit(req, res, GateLogStatus.REJECTED);
function escortFrom(body) {
  if (body.alone === true) {
    return { alone: true, escortName: null };
  }
  if (body.alone !== false) {
    throw new HttpError(400, "Say who is with the student");
  }
  if (typeof body.escortName !== "string") {
    throw new HttpError(400, "Enter who is with the student");
  }
  const escortName = body.escortName.trim();
  if (escortName.length < 2 || escortName.length > 80) {
    throw new HttpError(400, "Enter who is with the student");
  }
  return { alone: false, escortName };
}
export const searchStudents = async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (query.length < 2) {
    res.json([]);
    return;
  }
  const directory = await loadDirectory();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const students = directory.students
    .filter((student) => {
      const haystack = [
        student.givenName,
        student.middleName,
        student.surname,
        student.studentNumber,
        student.classLabel,
        student.yearGroup,
      ]
        .filter((part) => part && String(part).trim() !== "")
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    })
    .slice(0, 20)
    .map((student) => ({
      id: student.id,
      name: studentName(student),
      classLabel: classLabel(student),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  res.json(students);
};
export const recordVisit = async (req, res) => {
  if (!isRecord(req.body)) {
    throw new HttpError(400, "Request body is required");
  }
  const type = req.body.type;
  if (type !== GateLogType.DROPOFF && type !== GateLogType.PICKUP) {
    throw new HttpError(400, "type is invalid");
  }
  const studentIds = idList(req.body.studentIds, "studentIds");
  if (!studentIds?.length) {
    throw new HttpError(400, "Choose at least one student");
  }
  const transport = requiredTransport(req.body.transport);
  const escort = escortFrom(req.body);
  const directory = await loadDirectory();
  const byId = new Map(directory.students.map((student) => [student.id, student]));
  for (const studentId of studentIds) {
    if (!byId.has(studentId)) {
      throw new HttpError(400, "Student was not found");
    }
  }
  const visits = await todayVisits(studentIds);
  const { start, end } = schoolDayRange();
  const rows = [];
  for (const studentId of studentIds) {
    const student = byId.get(studentId);
    const name = studentName(student);
    const { dropoff: current, pickup: currentPickup } = visitFor(
      visits.get(studentId),
    );
    if (type === GateLogType.DROPOFF) {
      if (current && openDropoff(current)) {
        throw new HttpError(409, `${name} is already at the gate today`);
      }
      rows.push({ student, dropoffId: null });
      continue;
    }
    if (
      !current ||
      current.status !== GateLogStatus.APPROVED ||
      current.occurredAt < start ||
      current.occurredAt >= end ||
      currentPickup?.status === GateLogStatus.APPROVED
    ) {
      throw new HttpError(409, `${name} is not at school`);
    }
    if (currentPickup?.status === GateLogStatus.PENDING) {
      throw new HttpError(409, `${name} is already being picked up`);
    }
    rows.push({ student, dropoffId: current.id });
  }
  const visitId = randomUUID();
  const reviewedAt = new Date();
  const logs = await prisma.$transaction(
    rows.map(({ student, dropoffId }) =>
      prisma.gateLog.create({
        data: {
          type,
          status: GateLogStatus.APPROVED,
          sisStudentId: student.id,
          studentName: studentName(student),
          classLabel: classLabel(student),
          visitId,
          transport,
          alone: escort.alone,
          escortName: escort.escortName,
          dropoffId,
          reviewedById: req.user.id,
          reviewedAt,
        },
      }),
    ),
  );
  res.status(201).json(logs);
};
export const present = async (_req, res) => {
  const { start, end } = schoolDayRange();
  const dropoffs = await prisma.gateLog.findMany({
    where: {
      type: GateLogType.DROPOFF,
      status: GateLogStatus.APPROVED,
      sisStudentId: { not: null },
      occurredAt: { gte: start, lt: end },
    },
    include: { pickups: { select: { status: true } } },
    orderBy: { occurredAt: "desc" },
  });
  const seen = new Set();
  const students = [];
  for (const log of dropoffs) {
    if (seen.has(log.sisStudentId)) {
      continue;
    }
    seen.add(log.sisStudentId);
    const pickedUp = log.pickups.some(
      (pickup) => pickup.status === GateLogStatus.APPROVED,
    );
    if (pickedUp) {
      continue;
    }
    students.push({
      id: log.sisStudentId,
      name: log.studentName,
      classLabel: log.classLabel,
    });
  }
  students.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ count: students.length, students });
};
