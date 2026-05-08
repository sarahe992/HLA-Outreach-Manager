import { auth } from "@/lib/auth";
import StatsClient from "./StatsClient";

export default async function StatsPage() {
  const session = await auth();
  if (!session) return null;
  return <StatsClient role={session.user.role} />;
}
