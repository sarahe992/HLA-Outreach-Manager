import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import TeamsClient from "./TeamsClient";

export default async function TeamsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [teams, allUsers] = await Promise.all([
    db.team.findMany({
      where: { isArchived: false },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, yearInSchool: true, major: true },
          orderBy: [{ role: "asc" }, { name: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      select: { id: true, name: true, role: true, teamId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <TeamsClient
      teams={JSON.parse(JSON.stringify(teams))}
      allUsers={JSON.parse(JSON.stringify(allUsers))}
      role={session.user.role}
    />
  );
}
