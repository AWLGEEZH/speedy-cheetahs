import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHeadCoach } from "@/lib/auth";

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
