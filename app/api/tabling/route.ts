import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await db.tablingEvent.findMany({
    where: {},
    include: {
      team: true,
      slots: { include: { signups: { where: { cancelledAt: null }, include: { user: true } } } },
      postData: true,
      createdBy: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !["LEADERSHIP", "LEAD_AMBASSADOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { location, date, snackPlan, slots, teamId } = body;

  const resolvedTeamId =
    session.user.role === "LEADERSHIP" ? teamId : session.user.teamId;

  if (!resolvedTeamId) {
    return NextResponse.json({ error: "Team required" }, { status: 400 });
  }

  const event = await db.tablingEvent.create({
    data: {
      teamId: resolvedTeamId,
      location,
      date: new Date(date),
      snackPlan: snackPlan || null,
      createdById: session.user.id,
      slots: {
        create: (slots as { startTime: string; endTime: string }[]).map((s) => ({
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
        })),
      },
    },
    include: { slots: true },
  });
  return NextResponse.json(event, { status: 201 });
}
