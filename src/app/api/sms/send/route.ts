import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendBulkSms } from "@/lib/twilio";
import { z } from "zod";

const sendSmsSchema = z.object({
  message: z.string().min(1).max(1600),
});

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = sendSmsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const families = await prisma.family.findMany({
      where: { smsOptIn: true },
      select: { phone: true },
    });

    if (families.length === 0) {
      return NextResponse.json({ error: "No families with SMS opt-in" }, { status: 400 });
    }

    const phones = families.map((f) => f.phone);
    const result = await sendBulkSms(phones, parsed.data.message);

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
