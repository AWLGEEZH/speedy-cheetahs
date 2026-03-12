import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { chatMessageSchema } from "@/lib/validators";

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

    return NextResponse.json(message, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
