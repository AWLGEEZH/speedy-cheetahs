import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createPlayerSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAuth();
    const players = await prisma.player.findMany({
      include: { family: { select: { id: true, parentName: true, email: true, phone: true } } },
      orderBy: { lastName: "asc" },
    });
    return NextResponse.json(players);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = createPlayerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const player = await prisma.player.create({
      data: parsed.data,
      include: { family: { select: { id: true, parentName: true, phone: true } } },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}
