import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { normalizePhone } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);

    const playerSelect = {
      id: true,
      firstName: true,
      lastName: true,
      jerseyNumber: true,
      familyId: true,
    } as const;

    // Search primary family phone first
    let family = await prisma.family.findFirst({
      where: { phone: normalized },
      include: {
        players: { select: playerSelect, orderBy: { firstName: "asc" } },
      },
    });

    // If not found, search additional contacts' phone numbers
    if (!family) {
      const contact = await prisma.contact.findFirst({
        where: { phone: normalized },
        include: {
          family: {
            include: {
              players: { select: playerSelect, orderBy: { firstName: "asc" } },
            },
          },
        },
      });

      if (contact) {
        family = contact.family;
      }
    }

    if (!family) {
      return NextResponse.json({ error: "No family found" }, { status: 404 });
    }

    return NextResponse.json({
      id: family.id,
      parentName: family.parentName,
      players: family.players,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
