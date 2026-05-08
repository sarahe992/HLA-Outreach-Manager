import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import TeamsClient from "./TeamsClient";

export default async function TeamsPage() {
  const session = await auth();
  if (!session || session.user.role !== "LEADERSHIP") redirect("/dashboard/calendar");

  const teams = await db.team.findMany({ orderBy: { name: "asc" } });
  return <TeamsClient teams={JSON.parse(JSON.stringify(teams))} />;
}
