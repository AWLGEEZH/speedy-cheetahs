import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);

    const family = await prisma.family.findFirst({
      where: { phone: normalized },
      include: {
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jerseyNumber: true,
            familyId: true,
          },
          orderBy: { firstName: "asc" },
        },
      },
    });

    if (!family) {
      return NextResponse.json({ error: "No family found" }, { status: 404 });
    }

    return NextResponse.json({
      id: family.id,
      parentName: family.parentName,
      players: family.players,
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
