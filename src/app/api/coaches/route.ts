import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireHeadCoach, hashPassword } from "@/lib/auth";
import { createCoachSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAuth();

    const coaches = await prisma.coach.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(coaches);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireHeadCoach();
    const body = await request.json();
    const parsed = createCoachSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const count = await prisma.coach.count();
    if (count >= 4) {
      return NextResponse.json(
        { error: "Maximum of 4 coaches allowed" },
        { status: 400 }
      );
    }

    const existing = await prisma.coach.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A coach with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const coach = await prisma.coach.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: "ASSISTANT",
        phone: parsed.data.phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(coach, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
