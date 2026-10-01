import { Router } from "express";
import { Role } from "../generated/prisma/client.js";
import {
  dropoff,
  listAllowed,
  listPermissions,
  lookupParent,
  pickup,
  present,
  recordVisit,
  savePermission,
  searchStudents,
  today,
} from "../controllers/gate.js";
import { requireRole } from "../middleware/requireAuth.js";
export const gateRouter = Router();
gateRouter.get("/today", requireRole(Role.PARENT), today);
gateRouter.get("/allowed", requireRole(Role.PARENT), listAllowed);
gateRouter.get("/permissions", requireRole(Role.PARENT), listPermissions);
gateRouter.post("/permissions/lookup", requireRole(Role.PARENT), lookupParent);
gateRouter.put("/permissions", requireRole(Role.PARENT), savePermission);
gateRouter.post("/dropoff", requireRole(Role.PARENT), dropoff);
gateRouter.post("/pickup", requireRole(Role.PARENT), pickup);
gateRouter.get(
  "/present",
  requireRole(Role.SUPERADMIN, Role.ADMIN, Role.SECURITY),
  present,
);
gateRouter.get(
  "/students",
  requireRole(Role.SUPERADMIN, Role.ADMIN, Role.SECURITY),
  searchStudents,
);
gateRouter.post(
  "/record",
  requireRole(Role.SUPERADMIN, Role.ADMIN, Role.SECURITY),
  recordVisit,
);
