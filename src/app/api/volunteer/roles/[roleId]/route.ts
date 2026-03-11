import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    await requireAuth();
    const { roleId } = await params;
    await prisma.volunteerRole.delete({ where: { id: roleId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
  }
}
