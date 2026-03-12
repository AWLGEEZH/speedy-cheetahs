import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { coachRsvpSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireAuth();
    const { eventId } = await params;

    const rsvps = await prisma.coachRsvp.findMany({
      where: { eventId },
      include: { coach: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(rsvps);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch RSVPs" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const coach = await requireAuth();
    const { eventId } = await params;
    const body = await request.json();
    const parsed = coachRsvpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const rsvp = await prisma.coachRsvp.upsert({
      where: { eventId_coachId: { eventId, coachId: coach.coachId } },
      update: { status: parsed.data.status },
      create: { eventId, coachId: coach.coachId, status: parsed.data.status },
      include: { coach: { select: { id: true, name: true } } },
    });

    return NextResponse.json(rsvp);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save RSVP" }, { status: 500 });
  }
}
