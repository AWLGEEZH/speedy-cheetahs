import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { attendanceRsvpSchema } from "@/lib/validators";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Check if caller is an authenticated coach
    const session = await getSession();

    const rsvps = await prisma.attendanceRsvp.findMany({
      where: { eventId },
      include: {
        player: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true } },
        family: {
          select: {
            id: true,
            // Only expose parentName to authenticated coaches
            ...(session ? { parentName: true } : {}),
          },
        },
      },
      orderBy: { player: { lastName: "asc" } },
    });
    return NextResponse.json(rsvps);
  } catch {
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const ip = getClientIp(request);
    const { success } = rateLimit(`attendance-rsvp:${ip}`, 20, 15 * 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { eventId } = await params;
    const body = await request.json();
    const parsed = attendanceRsvpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Verify the player belongs to the specified family
    const player = await prisma.player.findUnique({
      where: { id: parsed.data.playerId },
      select: { familyId: true },
    });

    if (!player || player.familyId !== parsed.data.familyId) {
      return NextResponse.json({ error: "Player does not belong to this family" }, { status: 400 });
    }

    const rsvp = await prisma.attendanceRsvp.upsert({
      where: {
        eventId_playerId: { eventId, playerId: parsed.data.playerId },
      },
      create: {
        eventId,
        playerId: parsed.data.playerId,
        familyId: parsed.data.familyId,
        status: parsed.data.status,
      },
      update: {
        status: parsed.data.status,
      },
      include: {
        player: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(rsvp);
  } catch {
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
  }
}
