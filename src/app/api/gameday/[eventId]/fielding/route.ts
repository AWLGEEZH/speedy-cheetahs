import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { fieldingAssignmentSchema, recordOutSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const gameState = await prisma.gameState.findUnique({
      where: { eventId },
      include: {
        fieldingEntries: {
          include: {
            player: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true } },
          },
          orderBy: [{ inning: "asc" }, { position: "asc" }],
        },
      },
    });

    if (!gameState) {
      return NextResponse.json({ gameState: null });
    }

    return NextResponse.json({ gameState });
  } catch {
    return NextResponse.json({ error: "Failed to fetch fielding" }, { status: 500 });
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
    const parsed = fieldingAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    let gameState = await prisma.gameState.findUnique({ where: { eventId } });

    if (!gameState) {
      gameState = await prisma.gameState.create({
        data: { eventId, status: "IN_PROGRESS" },
      });
    }

    // Delete existing entries for this inning and create new ones
    await prisma.fieldingEntry.deleteMany({
      where: { gameStateId: gameState.id, inning: parsed.data.inning },
    });

    await prisma.fieldingEntry.createMany({
      data: parsed.data.assignments.map((a) => ({
        gameStateId: gameState.id,
        playerId: a.playerId,
        inning: parsed.data.inning,
        position: a.position,
      })),
    });

    // Update current inning on game state
    await prisma.gameState.update({
      where: { id: gameState.id },
      data: { currentInning: parsed.data.inning },
    });

    const result = await prisma.gameState.findUnique({
      where: { id: gameState.id },
      include: {
        fieldingEntries: {
          include: {
            player: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true } },
          },
          orderBy: [{ inning: "asc" }, { position: "asc" }],
        },
      },
    });

    return NextResponse.json({ gameState: result });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save fielding" }, { status: 500 });
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
    const parsed = recordOutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const gameState = await prisma.gameState.findUnique({ where: { eventId } });

    if (!gameState) {
      return NextResponse.json({ error: "Game not started" }, { status: 400 });
    }

    // Increment outsRecorded for all non-bench fielders in this inning
    await prisma.fieldingEntry.updateMany({
      where: {
        gameStateId: gameState.id,
        inning: parsed.data.inning,
        position: { not: "BENCH" },
      },
      data: { outsRecorded: { increment: 1 } },
    });

    await prisma.gameState.update({
      where: { id: gameState.id },
      data: { totalOuts: { increment: 1 } },
    });

    const result = await prisma.gameState.findUnique({
      where: { id: gameState.id },
      include: {
        fieldingEntries: {
          include: {
            player: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true } },
          },
          orderBy: [{ inning: "asc" }, { position: "asc" }],
        },
      },
    });

    return NextResponse.json({ gameState: result });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to record out" }, { status: 500 });
  }
}
