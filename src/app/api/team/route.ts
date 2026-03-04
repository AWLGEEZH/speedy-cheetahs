import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { saveRulesSchema } from "@/lib/validators";

export async function GET() {
  try {
    const team = await prisma.team.findFirst();
    return NextResponse.json(team);
  } catch {
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();

    // Handle rules update
    if (body.rulesText !== undefined) {
      const parsed = saveRulesSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
    }

    const team = await prisma.team.findFirst();
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const updated = await prisma.team.update({
      where: { id: team.id },
      data: {
        name: body.name ?? undefined,
        rulesText: body.rulesText ?? undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}
