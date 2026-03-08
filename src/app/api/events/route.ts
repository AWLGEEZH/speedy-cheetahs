import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createEventSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const upcoming = searchParams.get("upcoming");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (upcoming === "true") {
      where.date = { gte: new Date() };
      where.isCancelled = false;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        volunteerRoles: {
          include: {
            signups: { include: { family: { select: { id: true, parentName: true } } } },
          },
        },
        _count: {
          select: {
            attendanceRsvps: { where: { status: "CONFIRMED" } },
          },
        },
      },
    });

    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        ...parsed.data,
        date: new Date(parsed.data.date),
        endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
