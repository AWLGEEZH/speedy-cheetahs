import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { queryRules } from "@/lib/claude";
import { rulesQuerySchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = rulesQuerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const team = await prisma.team.findFirst();
    if (!team?.rulesText) {
      return NextResponse.json(
        { error: "No rules have been entered yet. Add rules in the Rules page first." },
        { status: 400 }
      );
    }

    const answer = await queryRules(team.rulesText, parsed.data.question);
    return NextResponse.json({ answer });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("AI rules error:", e);
    return NextResponse.json({ error: "Failed to query rules" }, { status: 500 });
  }
}
