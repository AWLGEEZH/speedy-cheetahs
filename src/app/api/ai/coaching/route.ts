import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generateCoachingResponse, getKnowledgeBaseContext } from "@/lib/claude";
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

    const kbContext = await getKnowledgeBaseContext();
    const recommendation = await generateCoachingResponse(
      parsed.data.question,
      kbContext
    );

    const coachingSession = await prisma.coachingSession.create({
      data: {
        coachId: session.coachId,
        goals: parsed.data.question,
        observations: null,
        focusArea: null,
        recommendation,
      },
    });

    return NextResponse.json(coachingSession, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
