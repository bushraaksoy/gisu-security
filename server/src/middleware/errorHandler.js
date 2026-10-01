export const errorHandler = (err, _req, res, _next) => {
  console.error(err)
  const status =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof err.status === "number"
      ? err.status
      : 500
  const message = err instanceof Error ? err.message : "Internal server error"
  res.status(status).json({ message })
}
