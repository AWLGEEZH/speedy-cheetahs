import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createFamilySchema } from "@/lib/validators";
import { normalizePhone } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    await requireAuth();
    const families = await prisma.family.findMany({
      include: { players: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { parentName: "asc" },
    });
    return NextResponse.json(families);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch families" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success } = rateLimit(`family-create:${ip}`, 5, 60 * 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

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
