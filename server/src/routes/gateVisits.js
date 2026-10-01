import { Router } from "express"
import { approveVisit, rejectVisit } from "../controllers/gate.js"
export const gateVisitsRouter = Router()
gateVisitsRouter.post("/:visitId/approve", approveVisit)
gateVisitsRouter.post("/:visitId/reject", rejectVisit)
