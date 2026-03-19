import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireHeadCoach } from "@/lib/auth";
import { updateTeamSettingsSchema } from "@/lib/validators";

export async function GET() {
  try {
    const team = await prisma.team.findFirst();
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Only return registrationCode to authenticated coaches
    const session = await getSession();
    if (session) {
      return NextResponse.json(team);
    }

    // Public: return metadata + whether a code is set
    const { registrationCode, ...publicData } = team;
    return NextResponse.json({
      ...publicData,
      hasRegistrationCode: !!registrationCode,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireHeadCoach();
    const body = await request.json();
    const parsed = updateTeamSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const team = await prisma.team.findFirst();
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const updated = await prisma.team.update({
      where: { id: team.id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.rulesText !== undefined && { rulesText: parsed.data.rulesText }),
        ...(parsed.data.registrationCode !== undefined && {
          registrationCode: parsed.data.registrationCode,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}
