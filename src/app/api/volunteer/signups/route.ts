import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { volunteerSignupSchema } from "@/lib/validators";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const signups = await prisma.volunteerSignup.findMany({
      where: eventId
        ? { role: { eventId } }
        : undefined,
      include: {
        family: { select: { id: true, parentName: true } },
        role: { select: { id: true, name: true, eventId: true } },
      },
    });

    return NextResponse.json(signups);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch signups" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success } = rateLimit(`volunteer-signup:${ip}`, 10, 15 * 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = volunteerSignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Check if role has available slots
    const role = await prisma.volunteerRole.findUnique({
      where: { id: parsed.data.roleId },
      include: { _count: { select: { signups: true } } },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role._count.signups >= role.slotsNeeded) {
      return NextResponse.json({ error: "No available slots" }, { status: 400 });
    }

    const signup = await prisma.volunteerSignup.create({
      data: parsed.data,
      include: {
        family: { select: { id: true, parentName: true } },
        role: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(signup, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to sign up" }, { status: 500 });
  }
}
