import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getSession } from "@/lib/auth";
import { updateEventSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Check if caller is an authenticated coach
    const session = await getSession();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        volunteerRoles: {
          include: {
            signups: {
              include: {
                family: {
                  select: {
                    id: true,
                    // Only expose parentName to authenticated coaches
                    ...(session ? { parentName: true } : {}),
                  },
                },
              },
            },
          },
        },
        attendanceRsvps: {
          include: {
            player: true,
            family: {
              select: {
                id: true,
                // Only expose parentName to authenticated coaches
                ...(session ? { parentName: true } : {}),
              },
            },
          },
        },
        gameState: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
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
    const parsed = updateEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.date) data.date = new Date(parsed.data.date);
    if (parsed.data.endTime) data.endTime = new Date(parsed.data.endTime);

    const event = await prisma.event.update({
      where: { id: eventId },
      data,
    });

    return NextResponse.json(event);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireAuth();
    const { eventId } = await params;
    await prisma.event.delete({ where: { id: eventId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
