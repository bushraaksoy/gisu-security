import { Role } from "../generated/prisma/client.js"
import { directoryForGuardian, loadDirectory } from "../lib/directory.js"
export const getDirectory = async (req, res) => {
  const directory = await loadDirectory()
  if (req.user.role === Role.PARENT) {
    res.json(
      req.user.guardianId
        ? directoryForGuardian(directory, req.user.guardianId)
        : { students: [], guardians: [], links: [] }
    )
    return
  }
  res.json(directory)
}
