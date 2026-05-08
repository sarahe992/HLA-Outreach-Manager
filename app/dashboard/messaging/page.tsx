import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import MessagingClient from "./MessagingClient";

export default async function MessagingPage() {
  const session = await auth();
  if (!session) return null;

  const [threads, announcements, users, teams] = await Promise.all([
    db.thread.findMany({
      where: { members: { some: { userId: session.user.id } } },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        team: true,
        messages: {
          orderBy: { createdAt: "desc" }, take: 1,
          include: { sender: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.announcement.findMany({
      where: {
        recipients: {
          some: {
            OR: [
              { userId: session.user.id },
              { teamId: session.user.teamId ?? undefined },
              { userId: null, teamId: null },
            ],
          },
        },
      },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    ["LEADERSHIP", "LEAD_AMBASSADOR"].includes(session.user.role)
      ? db.user.findMany({
          where: session.user.role === "LEAD_AMBASSADOR"
            ? { teamId: session.user.teamId ?? "__none__" }
            : {},
          select: { id: true, name: true, role: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    session.user.role === "LEADERSHIP"
      ? db.team.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <MessagingClient
      threads={JSON.parse(JSON.stringify(threads))}
      announcements={JSON.parse(JSON.stringify(announcements))}
      users={JSON.parse(JSON.stringify(users))}
      teams={JSON.parse(JSON.stringify(teams))}
      currentUserId={session.user.id}
      role={session.user.role}
      teamId={session.user.teamId}
    />
  );
}
