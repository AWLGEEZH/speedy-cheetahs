-- AlterTable
ALTER TABLE "VolunteerSignup" ADD COLUMN     "reminder24hSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminder90mSent" BOOLEAN NOT NULL DEFAULT false;
