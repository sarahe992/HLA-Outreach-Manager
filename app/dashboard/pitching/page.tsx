import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import PitchingClient from "./PitchingClient";

export default async function PitchingPage() {
  const session = await auth();
  if (!session) return null;

  let events;
  if (session.user.role === "AMBASSADOR") {
    events = await db.pitchingEvent.findMany({
      where: { userId: session.user.id },
      orderBy: { scheduledAt: "desc" },
    });
  } else if (session.user.role === "LEAD_AMBASSADOR") {
    events = await db.pitchingEvent.findMany({
      where: { user: { teamId: session.user.teamId ?? "__none__" } },
      include: { user: { select: { name: true } } },
      orderBy: { scheduledAt: "desc" },
    });
  } else {
    events = await db.pitchingEvent.findMany({
      include: { user: { select: { name: true, team: true } } },
      orderBy: { scheduledAt: "desc" },
    });
  }

  return (
    <PitchingClient
      events={JSON.parse(JSON.stringify(events))}
      role={session.user.role}
      userId={session.user.id}
    />
  );
}
