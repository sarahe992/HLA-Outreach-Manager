import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";
import { addDays } from "date-fns";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "LEADERSHIP") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { role } = await request.json() as { role: Role };
  if (!["LEAD_AMBASSADOR", "LEADERSHIP"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  const invite = await db.inviteToken.create({
    data: {
      role,
      expiresAt: addDays(new Date(), 7),
      createdById: session.user.id,
    },
  });
  const base = (process.env.NEXTAUTH_URL || new URL(request.url).origin).replace(/\/$/, "");
  const url = `${base}/invite/${invite.token}`;
  return NextResponse.json({ token: invite.token, url }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "LEADERSHIP") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const invites = await db.inviteToken.findMany({
    where: { usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(invites);
}
