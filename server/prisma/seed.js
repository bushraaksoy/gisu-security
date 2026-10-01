import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client.js"
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
})
async function main() {
  const password = process.env.SUPERADMIN_PASSWORD
  if (!password) {
    throw new Error("SUPERADMIN_PASSWORD is not configured")
  }
  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.upsert({
    where: { username: "superadmin@gisu.local" },
    update: {
      name: "Super Admin",
      email: "superadmin@gisu.local",
      role: "SUPERADMIN",
      passwordHash,
    },
    create: {
      name: "Super Admin",
      username: "superadmin@gisu.local",
      email: "superadmin@gisu.local",
      role: "SUPERADMIN",
      passwordHash,
    },
  })
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
