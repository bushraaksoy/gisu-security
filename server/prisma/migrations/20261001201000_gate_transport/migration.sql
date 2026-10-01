-- CreateEnum
CREATE TYPE "Transport" AS ENUM ('CAR', 'BUS', 'FOOT');

-- AlterTable
ALTER TABLE "GateLog" ADD COLUMN "transport" "Transport";
