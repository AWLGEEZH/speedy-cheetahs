import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createResetToken } from "@/lib/auth";
import { sendSingleEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const coach = await prisma.coach.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!coach) {
      return NextResponse.json({ ok: true });
    }

    const token = await createResetToken(coach.id);

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : "http://localhost:3000");

    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await sendSingleEmail(
      coach.email,
      "Password Reset Request",
      `Hi ${coach.name},\n\nYou requested a password reset for your 3D Printed Diamonds coach account.\n\nClick the link below to set a new password (expires in 15 minutes):\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
