import { Router } from "express"
import { getDirectory } from "../controllers/directory.js"
export const directoryRouter = Router()
directoryRouter.get("/", getDirectory)
