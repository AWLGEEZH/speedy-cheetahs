import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createFamilySchema } from "@/lib/validators";
import { normalizePhone } from "@/lib/utils";

export async function GET() {
  try {
    const families = await prisma.family.findMany({
      include: { players: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { parentName: "asc" },
    });
    return NextResponse.json(families);
  } catch {
    return NextResponse.json({ error: "Failed to fetch families" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createFamilySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const family = await prisma.family.create({
      data: {
        ...parsed.data,
        phone: normalizePhone(parsed.data.phone),
        email: parsed.data.email || null,
      },
    });

    return NextResponse.json(family, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create family" }, { status: 500 });
  }
}
