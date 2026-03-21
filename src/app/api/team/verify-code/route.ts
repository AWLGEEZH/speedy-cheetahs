import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCodeSchema } from "@/lib/validators";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success } = rateLimit(`verify-code:${ip}`, 10, 15 * 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = verifyCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const team = await prisma.team.findFirst({
      select: { registrationCode: true },
    });

    if (!team || !team.registrationCode) {
      // No code set — treat as open (no gate)
      return NextResponse.json({ valid: true });
    }

    if (
      team.registrationCode.toLowerCase() !==
      parsed.data.code.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Invalid team code" },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
