import cors from "cors"
import express from "express"
import { errorHandler, notFound } from "./middleware/index.js"
import { apiRouter } from "./routes/index.js"
export function createApp() {
  const app = express()
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    })
  )
  app.use(express.json())
  app.use("/api", apiRouter)
  app.use(notFound)
  app.use(errorHandler)
  return app
}
