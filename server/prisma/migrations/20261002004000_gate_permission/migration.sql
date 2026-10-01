CREATE TABLE "GatePermission" (
    "id" TEXT NOT NULL,
    "sisStudentId" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "canDropoff" BOOLEAN NOT NULL DEFAULT false,
    "canPickup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatePermission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GatePermission_granteeId_idx" ON "GatePermission"("granteeId");

CREATE INDEX "GatePermission_grantedById_idx" ON "GatePermission"("grantedById");

CREATE UNIQUE INDEX "GatePermission_sisStudentId_granteeId_key" ON "GatePermission"("sisStudentId", "granteeId");

ALTER TABLE "GatePermission" ADD CONSTRAINT "GatePermission_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GatePermission" ADD CONSTRAINT "GatePermission_granteeId_fkey" FOREIGN KEY ("granteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
