-- AlterTable
ALTER TABLE "Family" ADD COLUMN     "emailOptIn" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Update" ADD COLUMN     "emailCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailSent" BOOLEAN NOT NULL DEFAULT false;
