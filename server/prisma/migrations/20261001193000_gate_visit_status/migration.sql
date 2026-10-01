-- CreateEnum
CREATE TYPE "GateLogStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "GateLog" ADD COLUMN "status" "GateLogStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "GateLog" ADD COLUMN "sisStudentId" TEXT;
ALTER TABLE "GateLog" ADD COLUMN "studentName" TEXT;
ALTER TABLE "GateLog" ADD COLUMN "classLabel" TEXT;
ALTER TABLE "GateLog" ADD COLUMN "dropoffId" TEXT;
ALTER TABLE "GateLog" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "GateLog" ADD COLUMN "reviewedAt" TIMESTAMP(3);

UPDATE "GateLog" SET "status" = 'APPROVED';

UPDATE "GateLog" AS g
SET "studentName" = s."givenName" || ' ' || s."surname"
FROM "Student" AS s
WHERE g."studentId" = s."id" AND g."studentName" IS NULL;

UPDATE "GateLog" SET "studentName" = 'Unknown' WHERE "studentName" IS NULL;

ALTER TABLE "GateLog" ALTER COLUMN "studentName" SET NOT NULL;
ALTER TABLE "GateLog" ALTER COLUMN "studentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "GateLog" ADD CONSTRAINT "GateLog_dropoffId_fkey" FOREIGN KEY ("dropoffId") REFERENCES "GateLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GateLog" ADD CONSTRAINT "GateLog_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
