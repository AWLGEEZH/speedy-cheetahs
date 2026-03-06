import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { updatePlayerSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { family: true },
    });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    return NextResponse.json(player);
  } catch {
    return NextResponse.json({ error: "Failed to fetch player" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    await requireAuth();
    const { playerId } = await params;
    const body = await request.json();
    const parsed = updatePlayerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const player = await prisma.player.update({
      where: { id: playerId },
      data: {
        ...(parsed.data.firstName !== undefined && { firstName: parsed.data.firstName }),
        ...(parsed.data.lastName !== undefined && { lastName: parsed.data.lastName }),
        ...(parsed.data.jerseyNumber !== undefined && { jerseyNumber: parsed.data.jerseyNumber }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
        ...(parsed.data.familyId !== undefined && { familyId: parsed.data.familyId }),
      },
      include: { family: true },
    });
    return NextResponse.json(player);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    await requireAuth();
    const { playerId } = await params;
    await prisma.player.delete({ where: { id: playerId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete player" }, { status: 500 });
  }
}
