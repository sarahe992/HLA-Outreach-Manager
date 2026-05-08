import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || !["LEADERSHIP", "LEAD_AMBASSADOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where =
    session.user.role === "LEAD_AMBASSADOR"
      ? { teamId: session.user.teamId ?? "__none__" }
      : {};

  const users = await db.user.findMany({
    where,
    select: { id: true, name: true, email: true, phone: true, role: true, teamId: true, team: true, graduationYear: true, major: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(users);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session || !["LEADERSHIP", "LEAD_AMBASSADOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, teamId } = await request.json();
  const user = await db.user.update({
    where: { id: userId },
    data: { teamId: teamId || null },
  });
  return NextResponse.json(user);
}
