import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { eventAllergySchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventIds = searchParams.get("eventIds");

    if (!eventIds) {
      return NextResponse.json({ error: "eventIds required" }, { status: 400 });
    }

    const ids = eventIds.split(",").filter(Boolean);

    const allergies = await prisma.eventAllergy.findMany({
      where: { eventId: { in: ids } },
      include: { family: { select: { parentName: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(allergies);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch allergies" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = eventAllergySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { eventId, familyId, allergies } = parsed.data;

    const record = await prisma.eventAllergy.upsert({
      where: { eventId_familyId: { eventId, familyId } },
      update: { allergies },
      create: { eventId, familyId, allergies },
      include: { family: { select: { parentName: true } } },
    });

    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save allergy info" },
      { status: 500 },
    );
  }
}
