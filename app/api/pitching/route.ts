import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let events;
  if (session.user.role === "AMBASSADOR") {
    events = await db.pitchingEvent.findMany({
      where: { userId: session.user.id },
      include: { user: { select: { name: true, teamId: true } } },
      orderBy: { scheduledAt: "desc" },
    });
  } else if (session.user.role === "LEAD_AMBASSADOR") {
    events = await db.pitchingEvent.findMany({
      where: { user: { teamId: session.user.teamId ?? "__none__" } },
      include: { user: { select: { name: true, teamId: true } } },
      orderBy: { scheduledAt: "desc" },
    });
  } else {
    events = await db.pitchingEvent.findMany({
      include: { user: { select: { name: true, teamId: true, team: true } } },
      orderBy: { scheduledAt: "desc" },
    });
  }
  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { className, professorName, scheduledAt } = await request.json();
  const event = await db.pitchingEvent.create({
    data: {
      userId: session.user.id,
      className,
      professorName,
      scheduledAt: new Date(scheduledAt),
    },
  });
  return NextResponse.json(event, { status: 201 });
}
