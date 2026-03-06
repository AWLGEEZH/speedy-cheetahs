import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sendSingleEmail } from "@/lib/email";
import { z } from "zod";

const testEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200).default("Test Email"),
  message: z.string().min(1).max(500).default("This is a test email from Speedy Cheetahs!"),
});

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = testEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await sendSingleEmail(
      parsed.data.to,
      parsed.data.subject,
      parsed.data.message
    );

    return NextResponse.json({
      ok: true,
      to: parsed.data.to,
      messageId: result.messageId,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const msg = e instanceof Error ? e.message : "Failed to send test email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
