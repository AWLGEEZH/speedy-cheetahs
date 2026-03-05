import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createKBTextSchema, createKBUrlSchema } from "@/lib/validators";
import { extractTextFromUrl, extractTextFromPdf } from "@/lib/extract";

export async function GET() {
  try {
    await requireAuth();

    const entries = await prisma.knowledgeBase.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        coach: { select: { name: true } },
      },
    });

    const result = entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      type: entry.type,
      sourceUrl: entry.sourceUrl,
      contentPreview: entry.content.slice(0, 200),
      coachName: entry.coach.name,
      createdAt: entry.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle PDF upload
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const title = formData.get("title") as string | null;

      if (!file) {
        return NextResponse.json({ error: "File is required" }, { status: 400 });
      }
      if (!title || title.trim().length === 0) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const content = await extractTextFromPdf(buffer);

      const entry = await prisma.knowledgeBase.create({
        data: {
          title: title.trim(),
          type: "PDF",
          content,
          coachId: session.coachId,
        },
        include: {
          coach: { select: { name: true } },
        },
      });

      return NextResponse.json(
        {
          id: entry.id,
          title: entry.title,
          type: entry.type,
          sourceUrl: entry.sourceUrl,
          contentPreview: entry.content.slice(0, 200),
          coachName: entry.coach.name,
          createdAt: entry.createdAt.toISOString(),
        },
        { status: 201 }
      );
    } else {
      // Handle JSON (TEXT or URL)
      const body = await request.json();

      if (body.type === "URL") {
        const parsed = createKBUrlSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        const rawContent = await extractTextFromUrl(parsed.data.sourceUrl);
        const content = rawContent.slice(0, 100000);

        const entry = await prisma.knowledgeBase.create({
          data: {
            title: parsed.data.title,
            type: "URL",
            sourceUrl: parsed.data.sourceUrl,
            content,
            coachId: session.coachId,
          },
          include: {
            coach: { select: { name: true } },
          },
        });

        return NextResponse.json(
          {
            id: entry.id,
            title: entry.title,
            type: entry.type,
            sourceUrl: entry.sourceUrl,
            contentPreview: entry.content.slice(0, 200),
            coachName: entry.coach.name,
            createdAt: entry.createdAt.toISOString(),
          },
          { status: 201 }
        );
      } else if (body.type === "TEXT") {
        const parsed = createKBTextSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        const entry = await prisma.knowledgeBase.create({
          data: {
            title: parsed.data.title,
            type: "TEXT",
            content: parsed.data.content,
            coachId: session.coachId,
          },
          include: {
            coach: { select: { name: true } },
          },
        });

        return NextResponse.json(
          {
            id: entry.id,
            title: entry.title,
            type: entry.type,
            sourceUrl: entry.sourceUrl,
            contentPreview: entry.content.slice(0, 200),
            coachName: entry.coach.name,
            createdAt: entry.createdAt.toISOString(),
          },
          { status: 201 }
        );
      } else {
        return NextResponse.json(
          { error: "Invalid type. Must be TEXT or URL" },
          { status: 400 }
        );
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Knowledge base error:", e);
    return NextResponse.json({ error: "Failed to create knowledge base entry" }, { status: 500 });
  }
}
