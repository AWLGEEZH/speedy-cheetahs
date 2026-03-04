-- CreateEnum
CREATE TYPE "CoachRole" AS ENUM ('HEAD', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('GAME', 'PRACTICE', 'OTHER');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "FieldPosition" AS ENUM ('PITCHER', 'CATCHER', 'FIRST_BASE', 'SECOND_BASE', 'THIRD_BASE', 'SHORTSTOP', 'LEFT_FIELD', 'CENTER_FIELD', 'RIGHT_FIELD', 'LEFT_CENTER', 'RIGHT_CENTER', 'BENCH');

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "CoachRole" NOT NULL DEFAULT 'ASSISTANT',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Speedy Cheetahs',
    "league" TEXT NOT NULL DEFAULT 'Farm-1',
    "season" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "rulesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "smsOptIn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "jerseyNumber" INTEGER,
    "notes" TEXT,
    "familyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "title" TEXT NOT NULL,
    "opponent" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "locationName" TEXT NOT NULL,
    "locationAddress" TEXT,
    "notes" TEXT,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Update" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "smsCount" INTEGER NOT NULL DEFAULT 0,
    "eventId" TEXT,
    "coachId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Update_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slotsNeeded" INTEGER NOT NULL DEFAULT 1,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerSignup" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameState" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "currentInning" INTEGER NOT NULL DEFAULT 1,
    "isTopInning" BOOLEAN NOT NULL DEFAULT true,
    "currentBatterIndex" INTEGER NOT NULL DEFAULT 0,
    "totalOuts" INTEGER NOT NULL DEFAULT 0,
    "status" "GameStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRsvp" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattingEntry" (
    "id" TEXT NOT NULL,
    "gameStateId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "battingOrder" INTEGER NOT NULL,
    "atBatCount" INTEGER NOT NULL DEFAULT 0,
    "currentAtBat" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BattingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldingEntry" (
    "id" TEXT NOT NULL,
    "gameStateId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "inning" INTEGER NOT NULL,
    "position" "FieldPosition" NOT NULL,
    "outsRecorded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingSession" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "goals" TEXT NOT NULL,
    "observations" TEXT NOT NULL,
    "focusArea" TEXT,
    "recommendation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coach_email_key" ON "Coach"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Team_shareToken_key" ON "Team"("shareToken");

-- CreateIndex
CREATE INDEX "Player_familyId_idx" ON "Player"("familyId");

-- CreateIndex
CREATE INDEX "Update_eventId_idx" ON "Update"("eventId");

-- CreateIndex
CREATE INDEX "Update_coachId_idx" ON "Update"("coachId");

-- CreateIndex
CREATE INDEX "VolunteerRole_eventId_idx" ON "VolunteerRole"("eventId");

-- CreateIndex
CREATE INDEX "VolunteerSignup_roleId_idx" ON "VolunteerSignup"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerSignup_familyId_roleId_key" ON "VolunteerSignup"("familyId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "GameState_eventId_key" ON "GameState"("eventId");

-- CreateIndex
CREATE INDEX "AttendanceRsvp_eventId_idx" ON "AttendanceRsvp"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRsvp_eventId_playerId_key" ON "AttendanceRsvp"("eventId", "playerId");

-- CreateIndex
CREATE INDEX "BattingEntry_gameStateId_idx" ON "BattingEntry"("gameStateId");

-- CreateIndex
CREATE UNIQUE INDEX "BattingEntry_gameStateId_playerId_key" ON "BattingEntry"("gameStateId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "BattingEntry_gameStateId_battingOrder_key" ON "BattingEntry"("gameStateId", "battingOrder");

-- CreateIndex
CREATE INDEX "FieldingEntry_gameStateId_idx" ON "FieldingEntry"("gameStateId");

-- CreateIndex
CREATE INDEX "FieldingEntry_playerId_idx" ON "FieldingEntry"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldingEntry_gameStateId_playerId_inning_key" ON "FieldingEntry"("gameStateId", "playerId", "inning");

-- CreateIndex
CREATE INDEX "CoachingSession_coachId_idx" ON "CoachingSession"("coachId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Update" ADD CONSTRAINT "Update_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Update" ADD CONSTRAINT "Update_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerRole" ADD CONSTRAINT "VolunteerRole_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerSignup" ADD CONSTRAINT "VolunteerSignup_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerSignup" ADD CONSTRAINT "VolunteerSignup_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "VolunteerRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameState" ADD CONSTRAINT "GameState_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRsvp" ADD CONSTRAINT "AttendanceRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRsvp" ADD CONSTRAINT "AttendanceRsvp_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRsvp" ADD CONSTRAINT "AttendanceRsvp_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattingEntry" ADD CONSTRAINT "BattingEntry_gameStateId_fkey" FOREIGN KEY ("gameStateId") REFERENCES "GameState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattingEntry" ADD CONSTRAINT "BattingEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldingEntry" ADD CONSTRAINT "FieldingEntry_gameStateId_fkey" FOREIGN KEY ("gameStateId") REFERENCES "GameState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldingEntry" ADD CONSTRAINT "FieldingEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingSession" ADD CONSTRAINT "CoachingSession_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
