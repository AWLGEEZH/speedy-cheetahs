import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { updateUpdateSchema } from "@/lib/validators";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ updateId: string }> }
) {
  try {
    const session = await requireAuth();
    const { updateId } = await params;
    const body = await request.json();
    const parsed = updateUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.update.findUnique({
      where: { id: updateId },
      select: { coachId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    const coach = await prisma.coach.findUnique({
      where: { id: session.coachId },
      select: { role: true },
    });

    if (existing.coachId !== session.coachId && coach?.role !== "HEAD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const update = await prisma.update.update({
      where: { id: updateId },
      data: {
        title: parsed.data.title,
        message: parsed.data.message,
        imageUrl: parsed.data.imageUrl || null,
      },
      include: {
        coach: { select: { name: true } },
        event: { select: { title: true } },
      },
    });

    return NextResponse.json(update);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ updateId: string }> }
) {
  try {
    const session = await requireAuth();
    const { updateId } = await params;

    const existing = await prisma.update.findUnique({
      where: { id: updateId },
      select: { coachId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    const coach = await prisma.coach.findUnique({
      where: { id: session.coachId },
      select: { role: true },
    });

    if (existing.coachId !== session.coachId && coach?.role !== "HEAD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.update.delete({ where: { id: updateId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete update" }, { status: 500 });
  }
}
