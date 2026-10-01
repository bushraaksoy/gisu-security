import { Router } from "express";
import { Role } from "../generated/prisma/client.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { authRouter } from "./auth.js";
import { directoryRouter } from "./directory.js";
import { gateRouter } from "./gate.js";
import { gateLogsRouter } from "./gateLogs.js"
import { gateVisitsRouter } from "./gateVisits.js";
import { healthRouter } from "./health.js";
import { studentsRouter } from "./students.js";
import { usersRouter } from "./users.js";
export const apiRouter = Router();
apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use(requireAuth);
apiRouter.use(
  "/directory",
  requireRole(Role.SUPERADMIN, Role.ADMIN, Role.PARENT),
  directoryRouter,
);
apiRouter.use("/users", requireRole(Role.SUPERADMIN, Role.ADMIN), usersRouter);
apiRouter.use(
  "/students",
  requireRole(Role.SUPERADMIN, Role.ADMIN, Role.SECURITY),
  studentsRouter,
);
apiRouter.use("/gate", gateRouter);
apiRouter.use(
  "/gate-logs",
  requireRole(Role.SUPERADMIN, Role.ADMIN, Role.SECURITY),
  gateLogsRouter,
)
apiRouter.use(
  "/gate-visits",
  requireRole(Role.SUPERADMIN, Role.ADMIN, Role.SECURITY),
  gateVisitsRouter,
);
