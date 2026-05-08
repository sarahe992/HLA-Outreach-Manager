import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "AMBASSADOR") {
    const [tabling, pitching] = await Promise.all([
      db.tablingSignup.findMany({
        where: { userId: session.user.id, cancelledAt: null },
        include: { slot: { include: { tablingEvent: { include: { postData: true } } } } },
      }),
      db.pitchingEvent.findMany({ where: { userId: session.user.id } }),
    ]);

    const totalHours = tabling.reduce(
      (sum, s) => sum + (s.slot.tablingEvent.postData?.totalHours ?? 0),
      0
    );
    const studentsReached = tabling.reduce(
      (sum, s) => sum + (s.slot.tablingEvent.postData?.studentsReached ?? 0),
      0
    );

    return NextResponse.json({
      tablingEventsAttended: tabling.length,
      pitchingEventsLogged: pitching.length,
      totalHours,
      studentsReached,
    });
  }

  if (session.user.role === "LEAD_AMBASSADOR") {
    const teamId = session.user.teamId ?? "__none__";
    const [tablingEvents, pitchingEvents, ambassadors] = await Promise.all([
      db.tablingEvent.findMany({
        where: { teamId },
        include: { postData: true },
      }),
      db.pitchingEvent.findMany({ where: { user: { teamId } } }),
      db.user.findMany({
        where: { teamId, role: "AMBASSADOR" },
        include: {
          tablingSignups: {
            where: { cancelledAt: null },
            include: { slot: { include: { tablingEvent: { include: { postData: true } } } } },
          },
          pitchingEvents: true,
        },
      }),
    ]);

    return NextResponse.json({
      team: {
        tablingEvents: tablingEvents.length,
        pitchingEvents: pitchingEvents.length,
        studentsReached: tablingEvents.reduce((s, e) => s + (e.postData?.studentsReached ?? 0), 0),
        totalHours: tablingEvents.reduce((s, e) => s + (e.postData?.totalHours ?? 0), 0),
      },
      ambassadors: ambassadors.map((a) => ({
        id: a.id,
        name: a.name,
        eventsAttended: a.tablingSignups.length,
        pitchingLogged: a.pitchingEvents.length,
        totalHours: a.tablingSignups.reduce(
          (s, sg) => s + (sg.slot.tablingEvent.postData?.totalHours ?? 0),
          0
        ),
        studentsReached: a.tablingSignups.reduce(
          (s, sg) => s + (sg.slot.tablingEvent.postData?.studentsReached ?? 0),
          0
        ),
      })),
    });
  }

  // LEADERSHIP — org-wide
  const [teams, tablingEvents, pitchingEvents, users] = await Promise.all([
    db.team.findMany({ where: { isArchived: false } }),
    db.tablingEvent.findMany({ include: { postData: true, team: true } }),
    db.pitchingEvent.findMany({ include: { user: { select: { teamId: true } } } }),
    db.user.findMany({
      where: { role: "AMBASSADOR" },
      include: {
        team: true,
        tablingSignups: {
          where: { cancelledAt: null },
          include: { slot: { include: { tablingEvent: { include: { postData: true } } } } },
        },
        pitchingEvents: true,
      },
    }),
  ]);

  return NextResponse.json({
    orgWide: {
      tablingEvents: tablingEvents.length,
      pitchingEvents: pitchingEvents.length,
      studentsReached: tablingEvents.reduce((s, e) => s + (e.postData?.studentsReached ?? 0), 0),
      totalHours: tablingEvents.reduce((s, e) => s + (e.postData?.totalHours ?? 0), 0),
    },
    teams: teams.map((t) => {
      const te = tablingEvents.filter((e) => e.teamId === t.id);
      const pe = pitchingEvents.filter((e) => e.user.teamId === t.id);
      return {
        id: t.id,
        name: t.name,
        tablingEvents: te.length,
        pitchingEvents: pe.length,
        studentsReached: te.reduce((s, e) => s + (e.postData?.studentsReached ?? 0), 0),
        totalHours: te.reduce((s, e) => s + (e.postData?.totalHours ?? 0), 0),
      };
    }),
    ambassadors: users.map((a) => ({
      id: a.id,
      name: a.name,
      teamName: a.team?.name ?? "—",
      eventsAttended: a.tablingSignups.length,
      pitchingLogged: a.pitchingEvents.length,
      totalHours: a.tablingSignups.reduce(
        (s, sg) => s + (sg.slot.tablingEvent.postData?.totalHours ?? 0),
        0
      ),
      studentsReached: a.tablingSignups.reduce(
        (s, sg) => s + (sg.slot.tablingEvent.postData?.studentsReached ?? 0),
        0
      ),
    })),
  });
}
