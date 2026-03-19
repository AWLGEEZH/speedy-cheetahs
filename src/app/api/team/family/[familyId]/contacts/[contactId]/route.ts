import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamilyOrCoachAuth } from "@/lib/family-auth";

export async function DELETE(
  request: Request,
  {
    params,
  }: { params: Promise<{ familyId: string; contactId: string }> }
) {
  try {
    const { familyId, contactId } = await params;
    await requireFamilyOrCoachAuth(request, familyId);

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    if (contact.familyId !== familyId) {
      return NextResponse.json(
        { error: "Contact does not belong to this family" },
        { status: 403 }
      );
    }

    await prisma.contact.delete({
      where: { id: contactId },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
