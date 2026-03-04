import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generatePracticePlan } from "@/lib/claude";
import { coachingRequestSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAuth();
    const sessions = await prisma.coachingSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { coach: { select: { name: true } } },
    });
    return NextResponse.json(sessions);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = coachingRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const recommendation = await generatePracticePlan(
      parsed.data.goals,
      parsed.data.observations,
      parsed.data.focusArea
    );

    const coachingSession = await prisma.coachingSession.create({
      data: {
        coachId: session.coachId,
        goals: parsed.data.goals,
        observations: parsed.data.observations,
        focusArea: parsed.data.focusArea,
        recommendation,
      },
    });

    return NextResponse.json(coachingSession, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
