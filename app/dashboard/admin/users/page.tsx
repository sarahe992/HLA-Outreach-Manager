import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const session = await auth();
  if (!session || session.user.role === "AMBASSADOR") redirect("/dashboard/calendar");

  const [users, teams] = await Promise.all([
    db.user.findMany({
      where: session.user.role === "LEAD_AMBASSADOR"
        ? { teamId: session.user.teamId ?? "__none__" }
        : {},
      select: { id: true, name: true, email: true, role: true, teamId: true, team: true, graduationYear: true, major: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    db.team.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } }),
    session.user.role === "LEADERSHIP"
      ? db.inviteToken.findMany({
          where: { usedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const invites = session.user.role === "LEADERSHIP"
    ? await db.inviteToken.findMany({
        where: { usedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <UsersClient
      users={JSON.parse(JSON.stringify(users))}
      teams={JSON.parse(JSON.stringify(teams))}
      invites={JSON.parse(JSON.stringify(invites))}
      role={session.user.role}
    />
  );
}
