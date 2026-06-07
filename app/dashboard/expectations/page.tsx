import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ExpectationsClient from "./ExpectationsClient";

export default async function ExpectationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <ExpectationsClient role={session.user.role} />;
}
