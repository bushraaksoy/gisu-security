import { Router } from "express";
import { approveGateLog, rejectGateLog } from "../controllers/gate.js";
import {
  createGateLog,
  deleteGateLog,
  getGateLog,
  listGateLogs,
  updateGateLog,
} from "../controllers/gateLogs.js";
export const gateLogsRouter = Router();
gateLogsRouter.get("/", listGateLogs);
gateLogsRouter.post("/", createGateLog);
gateLogsRouter.post("/:id/approve", approveGateLog);
gateLogsRouter.post("/:id/reject", rejectGateLog);
gateLogsRouter.get("/:id", getGateLog);
gateLogsRouter.patch("/:id", updateGateLog);
gateLogsRouter.delete("/:id", deleteGateLog);
