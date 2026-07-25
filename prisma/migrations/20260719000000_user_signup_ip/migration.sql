-- Add client IP captured at guest creation, for per-IP abuse throttling.
ALTER TABLE "User" ADD COLUMN "signupIp" TEXT;

-- CreateIndex
CREATE INDEX "User_signupIp_idx" ON "User"("signupIp");
