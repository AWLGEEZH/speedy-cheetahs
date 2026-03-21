import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyResetToken, hashPassword, invalidateResetToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const payload = await verifyResetToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    const coach = await prisma.coach.findUnique({
      where: { id: payload.coachId },
      select: { id: true, name: true },
    });

    if (!coach) {
      return NextResponse.json(
        { error: "Coach not found" },
        { status: 404 }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.coach.update({
      where: { id: coach.id },
      data: { passwordHash },
    });

    // Invalidate the token so it cannot be reused
    invalidateResetToken(token);

    return NextResponse.json({ ok: true, name: coach.name });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
