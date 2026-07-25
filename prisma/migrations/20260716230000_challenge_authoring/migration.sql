-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "authorId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 50,
    "body" TEXT NOT NULL,
    "starter" TEXT,
    "starterLang" TEXT,
    "answerHash" TEXT NOT NULL,
    "answerType" TEXT NOT NULL DEFAULT 'text',
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "hints" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "solveCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug");
CREATE INDEX "Challenge_status_idx" ON "Challenge"("status");
CREATE INDEX "Challenge_authorId_idx" ON "Challenge"("authorId");
CREATE INDEX "Challenge_track_idx" ON "Challenge"("track");

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
