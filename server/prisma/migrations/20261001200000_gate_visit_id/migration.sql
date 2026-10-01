-- AlterTable
ALTER TABLE "GateLog" ADD COLUMN "visitId" TEXT;

-- CreateIndex
CREATE INDEX "GateLog_visitId_idx" ON "GateLog"("visitId");
