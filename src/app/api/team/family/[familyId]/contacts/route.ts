import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createContactSchema } from "@/lib/validators";
import { requireFamilyOrCoachAuth } from "@/lib/family-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const { familyId } = await params;
    await requireFamilyOrCoachAuth(request, familyId);

    const body = await request.json();
    const parsed = createContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify family exists
    const family = await prisma.family.findUnique({
      where: { id: familyId },
    });
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    const contact = await prisma.contact.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        relationship: parsed.data.relationship || null,
        familyId,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to add contact" },
      { status: 500 }
    );
  }
}
