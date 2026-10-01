-- AlterEnum
ALTER TYPE "Transport" ADD VALUE 'BODA';

-- AlterTable
ALTER TABLE "GateLog" ADD COLUMN "alone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GateLog" ADD COLUMN "escortName" TEXT;
