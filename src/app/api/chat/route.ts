import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { chatMessageSchema } from "@/lib/validators";
import { sendBulkEmail } from "@/lib/email";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after");

    const where: Record<string, unknown> = {};
    if (after) {
      where.createdAt = { gt: new Date(after) };
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      include: { coach: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    return NextResponse.json(messages);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const coach = await requireAuth();
    const body = await request.json();
    const parsed = chatMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        coachId: coach.coachId,
        content: parsed.data.content,
      },
      include: { coach: { select: { id: true, name: true } } },
    });

    // Fire-and-forget: email other coaches who have notifications enabled
    (async () => {
      try {
        const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
        const cutoff = new Date(Date.now() - COOLDOWN_MS);

        const recipients = await prisma.coach.findMany({
          where: {
            chatNotifyEmail: true,
            id: { not: coach.coachId },
            OR: [
              { lastChatNotifiedAt: null },
              { lastChatNotifiedAt: { lt: cutoff } },
            ],
          },
          select: { id: true, email: true },
        });

        if (recipients.length === 0) return;

        const senderName = message.coach.name;
        const preview = parsed.data.content.length > 200
          ? parsed.data.content.slice(0, 200) + "..."
          : parsed.data.content;

        await sendBulkEmail(
          recipients.map((r) => r.email),
          `New chat message from ${senderName}`,
          `${senderName} posted in the coaches chat:\n\n"${preview}"\n\nLog in to view and reply.`
        );

        await prisma.coach.updateMany({
          where: { id: { in: recipients.map((r) => r.id) } },
          data: { lastChatNotifiedAt: new Date() },
        });
      } catch {
        // Email failure must not break chat
      }
    })();

    return NextResponse.json(message, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
