import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import twilio from "twilio";
import { z } from "zod";

const testSmsSchema = z.object({
  to: z.string().min(10).max(20),
  message: z.string().min(1).max(500).default("This is a test message from Speedy Cheetahs!"),
});

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = testSmsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const rawFrom = process.env.TWILIO_PHONE_NUMBER?.trim();

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 });
    }
    if (!rawFrom) {
      return NextResponse.json({ error: "TWILIO_PHONE_NUMBER not configured" }, { status: 500 });
    }

    // Normalize to E.164 format: strip everything except digits, then add +
    const digits = rawFrom.replace(/[^\d]/g, "");
    const from = digits.startsWith("1") ? `+${digits}` : `+1${digits}`;

    const client = twilio(accountSid, authToken);
    const msg = await client.messages.create({
      to: parsed.data.to,
      from,
      body: `[Speedy Cheetahs] ${parsed.data.message}`,
    });

    return NextResponse.json({
      ok: true,
      to: parsed.data.to,
      from,
      sid: msg.sid,
      status: msg.status,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const msg = e instanceof Error ? e.message : "Failed to send test SMS";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
