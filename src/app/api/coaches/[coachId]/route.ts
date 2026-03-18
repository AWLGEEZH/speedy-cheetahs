import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireHeadCoach } from "@/lib/auth";
import { updateCoachSchema } from "@/lib/validators";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const session = await requireAuth();
    const { coachId } = await params;
    const body = await request.json();
    const parsed = updateCoachSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Head coach can edit anyone; assistants can only edit themselves
    const currentCoach = await prisma.coach.findUnique({
      where: { id: session.coachId },
      select: { role: true },
    });

    if (!currentCoach) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentCoach.role !== "HEAD" && session.coachId !== coachId) {
      return NextResponse.json(
        { error: "You can only edit your own profile" },
        { status: 403 }
      );
    }

    // If email is changing, check uniqueness
    if (parsed.data.email) {
      const existing = await prisma.coach.findUnique({
        where: { email: parsed.data.email },
      });
      if (existing && existing.id !== coachId) {
        return NextResponse.json(
          { error: "A coach with this email already exists" },
          { status: 400 }
        );
      }
    }

    const coach = await prisma.coach.update({
      where: { id: coachId },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.email !== undefined && { email: parsed.data.email }),
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
        ...(parsed.data.chatNotifyEmail !== undefined && { chatNotifyEmail: parsed.data.chatNotifyEmail }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        chatNotifyEmail: true,
        createdAt: true,
      },
    });

    return NextResponse.json(coach);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update coach" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const session = await requireHeadCoach();
    const { coachId } = await params;

    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      select: { id: true, role: true },
    });

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    if (coach.role !== "ASSISTANT") {
      return NextResponse.json(
        { error: "Cannot delete a head coach" },
        { status: 400 }
      );
    }

    if (coach.id === session.coachId) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      );
    }

    await prisma.coach.delete({
      where: { id: coachId },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
