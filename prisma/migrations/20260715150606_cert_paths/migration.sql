-- AlterTable
ALTER TABLE "Path" ADD COLUMN     "certificationId" TEXT;

-- AddForeignKey
ALTER TABLE "Path" ADD CONSTRAINT "Path_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
