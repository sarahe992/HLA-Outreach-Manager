import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import TablingClient from "./TablingClient";

export default async function TablingPage() {
  const session = await auth();
  if (!session) return null;

  const [events, teams] = await Promise.all([
    db.tablingEvent.findMany({
      where: {},
      include: {
        team: true,
        slots: { include: { signups: { where: { cancelledAt: null } } } },
        postData: true,
      },
      orderBy: { date: "desc" },
    }),
    session.user.role === "LEADERSHIP"
      ? db.team.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } })
      : [],
  ]);

  return (
    <TablingClient
      events={JSON.parse(JSON.stringify(events))}
      teams={JSON.parse(JSON.stringify(teams))}
      role={session.user.role}
      userTeamId={session.user.teamId}
    />
  );
}
