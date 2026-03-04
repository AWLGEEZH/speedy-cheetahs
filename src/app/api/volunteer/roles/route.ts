import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createVolunteerRoleSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const roles = await prisma.volunteerRole.findMany({
      where: eventId ? { eventId } : undefined,
      include: {
        signups: { include: { family: { select: { id: true, parentName: true } } } },
        event: { select: { id: true, title: true, date: true, type: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(roles);
  } catch {
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = createVolunteerRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const role = await prisma.volunteerRole.create({
      data: parsed.data,
      include: { signups: true },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
