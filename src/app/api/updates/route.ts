import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { postUpdateSchema } from "@/lib/validators";
import { sendBulkSms } from "@/lib/twilio";
import { sendBulkEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/utils";

export async function GET() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const updates = await prisma.update.findMany({
      where: { createdAt: { gte: oneWeekAgo } },
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

    const { sendSms, sendEmail, ...updateData } = parsed.data;
    let smsSent = false;
    let smsCount = 0;
    let emailSent = false;
    let emailCount = 0;

    // Send SMS to opted-in families + additional contacts
    if (sendSms) {
      try {
        const families = await prisma.family.findMany({
          where: { smsOptIn: true },
          select: { phone: true, contacts: { select: { phone: true } } },
        });
        const phoneSet = new Set<string>();
        for (const f of families) {
          phoneSet.add(normalizePhone(f.phone));
          for (const c of f.contacts) {
            if (c.phone) phoneSet.add(normalizePhone(c.phone));
          }
        }
        const phones = [...phoneSet];
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

    // Send email to opted-in families + additional contacts
    if (sendEmail) {
      try {
        const families = await prisma.family.findMany({
          where: { emailOptIn: true, email: { not: null }, NOT: { email: "" } },
          select: { email: true, contacts: { select: { email: true } } },
        });
        const emailSet = new Set<string>();
        for (const f of families) {
          if (f.email) emailSet.add(f.email.toLowerCase().trim());
          for (const c of f.contacts) {
            if (c.email) emailSet.add(c.email.toLowerCase().trim());
          }
        }
        const emails = [...emailSet];
        if (emails.length > 0) {
          const result = await sendBulkEmail(
            emails,
            updateData.title,
            updateData.message
          );
          emailSent = true;
          emailCount = result.sent;
        }
      } catch {
        // Email failed but still create the update
      }
    }

    const update = await prisma.update.create({
      data: {
        ...updateData,
        imageUrl: updateData.imageUrl || null,
        eventId: updateData.eventId || null,
        coachId: session.coachId,
        smsSent,
        smsCount,
        emailSent,
        emailCount,
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
