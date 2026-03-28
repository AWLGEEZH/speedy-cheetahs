import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success } = rateLimit(`family-lookup:${ip}`, 10, 15 * 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

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

    // Search primary family phone — find all matches and prefer the one with players
    const families = await prisma.family.findMany({
      where: { phone: normalized },
      include: {
        players: { select: playerSelect, orderBy: { firstName: "asc" } },
      },
    });

    let family = families.find((f) => f.players.length > 0) ?? families[0] ?? null;

    // If not found, search additional contacts' phone numbers
    if (!family) {
      const contacts = await prisma.contact.findMany({
        where: { phone: normalized },
        include: {
          family: {
            include: {
              players: { select: playerSelect, orderBy: { firstName: "asc" } },
            },
          },
        },
      });

      const match = contacts.find((ct) => ct.family.players.length > 0) ?? contacts[0];
      if (match) {
        family = match.family;
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
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
