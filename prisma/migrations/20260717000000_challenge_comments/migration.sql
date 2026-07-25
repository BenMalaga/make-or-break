-- CreateTable
CREATE TABLE "ChallengeComment" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChallengeComment_slug_idx" ON "ChallengeComment"("slug");

-- AddForeignKey
ALTER TABLE "ChallengeComment" ADD CONSTRAINT "ChallengeComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
