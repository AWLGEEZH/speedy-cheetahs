import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const families = await prisma.family.findMany({
      where: {
        players: { some: {} },
      },
      include: {
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jerseyNumber: true,
          },
          orderBy: { firstName: "asc" },
        },
        contacts: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { parentName: "asc" },
    });

    return NextResponse.json(families);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch roster" },
      { status: 500 }
    );
  }
}
