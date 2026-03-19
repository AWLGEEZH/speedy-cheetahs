import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmPinSchema } from "@/lib/validators";
import { normalizePhone } from "@/lib/utils";
import { createFamilyToken } from "@/lib/family-auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = confirmPinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const normalized = normalizePhone(parsed.data.phone);

    // Find unexpired PIN for this phone
    const record = await prisma.verificationPin.findFirst({
      where: {
        phone: normalized,
        familyId: parsed.data.familyId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "No valid verification code found. Please request a new one." },
        { status: 401 }
      );
    }

    // Check if locked out (5 attempts)
    if (record.attempts >= 5) {
      await prisma.verificationPin.delete({ where: { id: record.id } });
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 429 }
      );
    }

    // Compare PIN
    const isValid = await bcrypt.compare(parsed.data.pin, record.pinHash);

    if (!isValid) {
      await prisma.verificationPin.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { error: "Incorrect code. Please try again." },
        { status: 401 }
      );
    }

    // PIN is valid — delete it and issue a family token
    await prisma.verificationPin.delete({ where: { id: record.id } });

    const token = await createFamilyToken(parsed.data.familyId);

    return NextResponse.json({ token });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
