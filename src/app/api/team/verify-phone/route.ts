import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPhoneSchema } from "@/lib/validators";
import { normalizePhone } from "@/lib/utils";
import { sendSingleSms } from "@/lib/twilio";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyPhoneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const normalized = normalizePhone(parsed.data.phone);

    // Verify this phone belongs to the family (primary or additional contact)
    const family = await prisma.family.findUnique({
      where: { id: parsed.data.familyId },
      select: {
        phone: true,
        contacts: { select: { phone: true } },
      },
    });

    if (!family) {
      return NextResponse.json(
        { error: "Phone number does not match this family" },
        { status: 400 }
      );
    }

    const familyPhones = [
      normalizePhone(family.phone),
      ...family.contacts
        .filter((c) => c.phone)
        .map((c) => normalizePhone(c.phone!)),
    ];

    if (!familyPhones.includes(normalized)) {
      return NextResponse.json(
        { error: "Phone number does not match this family" },
        { status: 400 }
      );
    }

    // Rate limit: check for existing unexpired PIN for this phone
    const existing = await prisma.verificationPin.findFirst({
      where: {
        phone: normalized,
        expiresAt: { gt: new Date() },
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }, // within last 60s
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Please wait 60 seconds before requesting a new code" },
        { status: 429 }
      );
    }

    // Generate 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const pinHash = await bcrypt.hash(pin, 10);

    // Clean up old PINs for this phone
    await prisma.verificationPin.deleteMany({
      where: { phone: normalized },
    });

    // Store new PIN with 10-minute expiry
    await prisma.verificationPin.create({
      data: {
        phone: normalized,
        pinHash,
        familyId: parsed.data.familyId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send SMS
    await sendSingleSms(
      normalized,
      `Your verification code is: ${pin}. It expires in 10 minutes.`
    );

    return NextResponse.json({ sent: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to send verification code";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
