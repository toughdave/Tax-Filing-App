-- CreateTable
CREATE TABLE "TotpDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedSecret" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "recoveryCodes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TotpDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TotpDevice_userId_key" ON "TotpDevice"("userId");

-- CreateIndex
CREATE INDEX "TotpDevice_userId_idx" ON "TotpDevice"("userId");

-- AddForeignKey
ALTER TABLE "TotpDevice" ADD CONSTRAINT "TotpDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
