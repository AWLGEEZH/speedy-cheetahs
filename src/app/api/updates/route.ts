import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { postUpdateSchema } from "@/lib/validators";
import { sendBulkSms } from "@/lib/twilio";

export async function GET() {
  try {
    const updates = await prisma.update.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        coach: { select: { name: true } },
        event: { select: { title: true } },
      },
    });
    return NextResponse.json(updates);
  } catch {
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = postUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { sendSms, ...updateData } = parsed.data;
    let smsSent = false;
    let smsCount = 0;

    if (sendSms) {
      try {
        const families = await prisma.family.findMany({
          where: { smsOptIn: true },
          select: { phone: true },
        });
        const phones = families.map((f) => f.phone);
        if (phones.length > 0) {
          const result = await sendBulkSms(
            phones,
            `${updateData.title}: ${updateData.message}`
          );
          smsSent = true;
          smsCount = result.sent;
        }
      } catch {
        // SMS failed but still create the update
      }
    }

    const update = await prisma.update.create({
      data: {
        ...updateData,
        eventId: updateData.eventId || null,
        coachId: session.coachId,
        smsSent,
        smsCount,
      },
      include: {
        coach: { select: { name: true } },
        event: { select: { title: true } },
      },
    });

    return NextResponse.json(update, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Update error:", e);
    return NextResponse.json({ error: "Failed to create update" }, { status: 500 });
  }
}
