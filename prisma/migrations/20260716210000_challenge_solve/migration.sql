-- CreateTable
CREATE TABLE "ChallengeSolve" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "solvedAt" TIMESTAMP(3),
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeSolve_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeSolve_userId_slug_key" ON "ChallengeSolve"("userId", "slug");

-- CreateIndex
CREATE INDEX "ChallengeSolve_userId_idx" ON "ChallengeSolve"("userId");

-- CreateIndex
CREATE INDEX "ChallengeSolve_slug_idx" ON "ChallengeSolve"("slug");

-- AddForeignKey
ALTER TABLE "ChallengeSolve" ADD CONSTRAINT "ChallengeSolve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
