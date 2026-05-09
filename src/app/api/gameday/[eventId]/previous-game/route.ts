import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/gameday/[eventId]/previous-game
 *
 * Returns the previous past game's batting order and fielding assignments
 * for use as a comparison base when generating new lineups (so the new
 * game can avoid placing players in the same slots as last week).
 *
 * Returns empty maps if no previous game exists.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const currentEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { date: true },
    });

    if (!currentEvent) {
      return NextResponse.json({
        previousEventId: null,
        previousEventTitle: null,
        battingByPlayer: {},
        fieldingByPlayer: {},
      });
    }

    const previousEvent = await prisma.event.findFirst({
      where: {
        type: "GAME",
        date: { lt: currentEvent.date },
        isCancelled: false,
      },
      orderBy: { date: "desc" },
      select: { id: true, title: true },
    });

    if (!previousEvent) {
      return NextResponse.json({
        previousEventId: null,
        previousEventTitle: null,
        battingByPlayer: {},
        fieldingByPlayer: {},
      });
    }

    const gameState = await prisma.gameState.findUnique({
      where: { eventId: previousEvent.id },
      include: {
        battingEntries: {
          select: { playerId: true, battingOrder: true },
        },
        fieldingEntries: {
          select: { playerId: true, position: true, inning: true },
        },
      },
    });

    const battingByPlayer: Record<string, number> = {};
    const fieldingByPlayer: Record<number, Record<string, string>> = {};

    if (gameState) {
      for (const entry of gameState.battingEntries) {
        battingByPlayer[entry.playerId] = entry.battingOrder;
      }
      for (const entry of gameState.fieldingEntries) {
        if (!fieldingByPlayer[entry.inning]) {
          fieldingByPlayer[entry.inning] = {};
        }
        fieldingByPlayer[entry.inning][entry.playerId] = entry.position;
      }
    }

    return NextResponse.json({
      previousEventId: previousEvent.id,
      previousEventTitle: previousEvent.title,
      battingByPlayer,
      fieldingByPlayer,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch previous game" }, { status: 500 });
  }
}
