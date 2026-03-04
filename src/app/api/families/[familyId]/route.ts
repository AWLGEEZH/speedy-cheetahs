import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const { familyId } = await params;
    const body = await request.json();
    const family = await prisma.family.update({
      where: { id: familyId },
      data: {
        parentName: body.parentName,
        email: body.email || null,
        phone: body.phone ? normalizePhone(body.phone) : undefined,
        smsOptIn: body.smsOptIn,
      },
    });
    return NextResponse.json(family);
  } catch {
    return NextResponse.json({ error: "Failed to update family" }, { status: 500 });
  }
}
