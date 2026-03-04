import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { initBattingSchema, battingActionSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const gameState = await prisma.gameState.findUnique({
      where: { eventId },
      include: {
        battingEntries: {
          include: {
            player: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true } },
          },
          orderBy: { battingOrder: "asc" },
        },
      },
    });

    if (!gameState) {
      return NextResponse.json({ gameState: null });
    }

    return NextResponse.json({ gameState });
  } catch {
    return NextResponse.json({ error: "Failed to fetch batting" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireAuth();
    const { eventId } = await params;
    const body = await request.json();
    const parsed = initBattingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Create or reset game state
    const gameState = await prisma.gameState.upsert({
      where: { eventId },
      create: { eventId, status: "IN_PROGRESS" },
      update: { currentBatterIndex: 0, status: "IN_PROGRESS", totalOuts: 0 },
    });

    // Delete existing entries and create new ones
    await prisma.battingEntry.deleteMany({ where: { gameStateId: gameState.id } });

    await prisma.battingEntry.createMany({
      data: parsed.data.playerOrder.map((playerId, index) => ({
        gameStateId: gameState.id,
        playerId,
        battingOrder: index + 1,
        currentAtBat: index === 0,
      })),
    });

    const result = await prisma.gameState.findUnique({
      where: { id: gameState.id },
      include: {
        battingEntries: {
          include: {
            player: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true } },
          },
          orderBy: { battingOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ gameState: result }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to initialize batting" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireAuth();
    const { eventId } = await params;
    const body = await request.json();
    const parsed = battingActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const gameState = await prisma.gameState.findUnique({
      where: { eventId },
      include: {
        battingEntries: { orderBy: { battingOrder: "asc" } },
      },
    });

    if (!gameState) {
      return NextResponse.json({ error: "Game not started" }, { status: 400 });
    }

    const entries = gameState.battingEntries;
    const totalBatters = entries.length;

    if (parsed.data.action === "NEXT_BATTER") {
      // Mark current batter's at-bat as complete, increment count
      const currentEntry = entries[gameState.currentBatterIndex];
      if (currentEntry) {
        await prisma.battingEntry.update({
          where: { id: currentEntry.id },
          data: { atBatCount: currentEntry.atBatCount + 1, currentAtBat: false },
        });
      }

      // Move to next batter (wrap around)
      const nextIndex = (gameState.currentBatterIndex + 1) % totalBatters;
      const nextEntry = entries[nextIndex];

      if (nextEntry) {
        await prisma.battingEntry.update({
          where: { id: nextEntry.id },
          data: { currentAtBat: true },
        });
      }

      await prisma.gameState.update({
        where: { id: gameState.id },
        data: { currentBatterIndex: nextIndex },
      });
    } else if (parsed.data.action === "UNDO") {
      // Go back one batter
      const currentEntry = entries[gameState.currentBatterIndex];
      if (currentEntry) {
        await prisma.battingEntry.update({
          where: { id: currentEntry.id },
          data: { currentAtBat: false },
        });
      }

      const prevIndex =
        (gameState.currentBatterIndex - 1 + totalBatters) % totalBatters;
      const prevEntry = entries[prevIndex];

      if (prevEntry) {
        await prisma.battingEntry.update({
          where: { id: prevEntry.id },
          data: {
            atBatCount: Math.max(0, prevEntry.atBatCount - 1),
            currentAtBat: true,
          },
        });
      }

      await prisma.gameState.update({
        where: { id: gameState.id },
        data: { currentBatterIndex: prevIndex },
      });
    }

    // Fetch updated state
    const updated = await prisma.gameState.findUnique({
      where: { id: gameState.id },
      include: {
        battingEntries: {
          include: {
            player: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true } },
          },
          orderBy: { battingOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ gameState: updated });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update batting" }, { status: 500 });
  }
}
