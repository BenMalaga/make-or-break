-- CreateTable
CREATE TABLE "DailyDropSolve" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyDropSolve_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyDropSolve_userId_dateKey_key" ON "DailyDropSolve"("userId", "dateKey");

-- CreateIndex
CREATE INDEX "DailyDropSolve_userId_idx" ON "DailyDropSolve"("userId");

-- CreateIndex
CREATE INDEX "DailyDropSolve_dateKey_idx" ON "DailyDropSolve"("dateKey");

-- AddForeignKey
ALTER TABLE "DailyDropSolve" ADD CONSTRAINT "DailyDropSolve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
