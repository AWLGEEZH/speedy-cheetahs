-- CreateEnum
CREATE TYPE "KBType" AS ENUM ('PDF', 'URL', 'TEXT');

-- DropForeignKey
ALTER TABLE "CoachingSession" DROP CONSTRAINT "CoachingSession_coachId_fkey";

-- DropForeignKey
ALTER TABLE "Update" DROP CONSTRAINT "Update_coachId_fkey";

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "KBType" NOT NULL,
    "sourceUrl" TEXT,
    "content" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeBase_coachId_idx" ON "KnowledgeBase"("coachId");

-- AddForeignKey
ALTER TABLE "Update" ADD CONSTRAINT "Update_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingSession" ADD CONSTRAINT "CoachingSession_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
