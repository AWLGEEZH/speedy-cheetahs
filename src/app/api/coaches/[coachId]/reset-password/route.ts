import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHeadCoach, hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validators";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    await requireHeadCoach();
    const { coachId } = await params;
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      select: { id: true, role: true, name: true },
    });

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    if (coach.role === "HEAD") {
      return NextResponse.json(
        { error: "Use the Change Password form to update your own password" },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(parsed.data.newPassword);
    await prisma.coach.update({
      where: { id: coachId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ ok: true, name: coach.name });
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
