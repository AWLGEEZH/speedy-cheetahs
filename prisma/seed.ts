import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PLAYERS = [
  { firstName: "Liam", lastName: "Anderson" },
  { firstName: "Noah", lastName: "Baker" },
  { firstName: "Oliver", lastName: "Carter" },
  { firstName: "Elijah", lastName: "Davis" },
  { firstName: "James", lastName: "Evans" },
  { firstName: "William", lastName: "Foster" },
  { firstName: "Benjamin", lastName: "Garcia" },
  { firstName: "Lucas", lastName: "Harris" },
  { firstName: "Henry", lastName: "Ingram" },
  { firstName: "Alexander", lastName: "Johnson" },
  { firstName: "Mason", lastName: "King" },
  { firstName: "Ethan", lastName: "Lopez" },
  { firstName: "Daniel", lastName: "Miller" },
  { firstName: "Jacob", lastName: "Nelson" },
  { firstName: "Logan", lastName: "Owens" },
  { firstName: "Jackson", lastName: "Patel" },
];

async function main() {
  console.log("Seeding database...");

  // Create team
  const team = await prisma.team.upsert({
    where: { id: "team-1" },
    update: {},
    create: {
      id: "team-1",
      name: "Speedy Cheetahs",
      league: "Farm-1",
      season: "Spring 2026",
    },
  });
  console.log(`  Team: ${team.name}`);

  // Create head coach
  const passwordHash = await bcrypt.hash("coach123", 12);
  const headCoach = await prisma.coach.upsert({
    where: { email: "coach@speedycheetahs.com" },
    update: {},
    create: {
      name: "Coach Dad",
      email: "coach@speedycheetahs.com",
      passwordHash,
      role: "HEAD",
      phone: "+15551234567",
    },
  });
  console.log(`  Head Coach: ${headCoach.name} (${headCoach.email})`);

  // Create assistant coach
  const assistantCoach = await prisma.coach.upsert({
    where: { email: "assistant@speedycheetahs.com" },
    update: {},
    create: {
      name: "Coach Mike",
      email: "assistant@speedycheetahs.com",
      passwordHash,
      role: "ASSISTANT",
      phone: "+15559876543",
    },
  });
  console.log(`  Assistant Coach: ${assistantCoach.name}`);

  // Create 16 families and players
  for (let i = 0; i < PLAYERS.length; i++) {
    const p = PLAYERS[i];
    const family = await prisma.family.upsert({
      where: { id: `family-${i + 1}` },
      update: {},
      create: {
        id: `family-${i + 1}`,
        parentName: `${p.firstName}'s Parent`,
        email: `${p.lastName.toLowerCase()}@example.com`,
        phone: `+1555${String(i + 1).padStart(3, "0")}0000`,
        smsOptIn: true,
      },
    });

    await prisma.player.upsert({
      where: { id: `player-${i + 1}` },
      update: {},
      create: {
        id: `player-${i + 1}`,
        firstName: p.firstName,
        lastName: p.lastName,
        jerseyNumber: i + 1,
        familyId: family.id,
      },
    });
  }
  console.log(`  Created ${PLAYERS.length} families and players`);

  // Create sample events
  const now = new Date();
  const events = [
    {
      id: "event-1",
      type: "PRACTICE" as const,
      title: "Practice",
      date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      locationName: "Central Park Field 3",
      locationAddress: "123 Park Ave",
    },
    {
      id: "event-2",
      type: "GAME" as const,
      title: "Game vs Blue Jays",
      opponent: "Blue Jays",
      date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      locationName: "Riverside Diamond",
      locationAddress: "456 River Rd",
    },
    {
      id: "event-3",
      type: "PRACTICE" as const,
      title: "Practice",
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      locationName: "Central Park Field 3",
      locationAddress: "123 Park Ave",
    },
    {
      id: "event-4",
      type: "GAME" as const,
      title: "Game vs Red Sox",
      opponent: "Red Sox",
      date: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      locationName: "Main Street Field",
      locationAddress: "789 Main St",
    },
  ];

  for (const e of events) {
    await prisma.event.upsert({
      where: { id: e.id },
      update: {},
      create: e,
    });
  }
  console.log(`  Created ${events.length} events`);

  // Create volunteer roles for the game
  await prisma.volunteerRole.upsert({
    where: { id: "role-1" },
    update: {},
    create: { id: "role-1", name: "Snacks", slotsNeeded: 2, eventId: "event-2" },
  });
  await prisma.volunteerRole.upsert({
    where: { id: "role-2" },
    update: {},
    create: { id: "role-2", name: "Drinks", slotsNeeded: 1, eventId: "event-2" },
  });
  await prisma.volunteerRole.upsert({
    where: { id: "role-3" },
    update: {},
    create: { id: "role-3", name: "Practice Traffic Manager", slotsNeeded: 2, eventId: "event-1" },
  });
  console.log("  Created volunteer roles");

  console.log("\nSeed complete!");
  console.log(`\nLogin credentials:`);
  console.log(`  Email: coach@speedycheetahs.com`);
  console.log(`  Password: coach123`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
