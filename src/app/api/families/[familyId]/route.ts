import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { updateFamilySchema } from "@/lib/validators";
import { normalizePhone } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const { familyId } = await params;
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: { players: true },
    });
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }
    return NextResponse.json(family);
  } catch {
    return NextResponse.json({ error: "Failed to fetch family" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    await requireAuth();
    const { familyId } = await params;
    const body = await request.json();
    const parsed = updateFamilySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const family = await prisma.family.update({
      where: { id: familyId },
      data: {
        ...(parsed.data.parentName !== undefined && { parentName: parsed.data.parentName }),
        ...(parsed.data.email !== undefined && { email: parsed.data.email || null }),
        ...(parsed.data.phone !== undefined && { phone: normalizePhone(parsed.data.phone) }),
        ...(parsed.data.smsOptIn !== undefined && { smsOptIn: parsed.data.smsOptIn }),
        ...(parsed.data.emailOptIn !== undefined && { emailOptIn: parsed.data.emailOptIn }),
      },
    });
    return NextResponse.json(family);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update family" }, { status: 500 });
  }
}
