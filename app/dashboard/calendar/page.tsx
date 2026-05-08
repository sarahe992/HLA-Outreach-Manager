import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) return null;

  const teamFilter =
    session.user.role === "LEADERSHIP"
      ? {}
      : { teamId: session.user.teamId ?? "__none__" };

  const [tablingEvents, pitchingEvents] = await Promise.all([
    db.tablingEvent.findMany({
      where: teamFilter,
      include: { team: true, slots: true },
      orderBy: { date: "asc" },
    }),
    session.user.role === "AMBASSADOR"
      ? db.pitchingEvent.findMany({ where: { userId: session.user.id } })
      : db.pitchingEvent.findMany({
          where:
            session.user.role === "LEAD_AMBASSADOR"
              ? { user: { teamId: session.user.teamId ?? "__none__" } }
              : {},
          include: { user: { select: { name: true } } },
        }),
  ]);

  return (
    <CalendarClient
      tablingEvents={JSON.parse(JSON.stringify(tablingEvents))}
      pitchingEvents={JSON.parse(JSON.stringify(pitchingEvents))}
      role={session.user.role}
    />
  );
}
