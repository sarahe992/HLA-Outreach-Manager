import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const threads = await db.thread.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      team: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(threads);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, recipientId, teamId } = await request.json();

  if (type === "DIRECT") {
    const existing = await db.thread.findFirst({
      where: {
        type: "DIRECT",
        members: { every: { userId: { in: [session.user.id, recipientId] } } },
      },
    });
    if (existing) return NextResponse.json(existing);

    const thread = await db.thread.create({
      data: {
        type: "DIRECT",
        members: {
          create: [{ userId: session.user.id }, { userId: recipientId }],
        },
      },
    });
    return NextResponse.json(thread, { status: 201 });
  }

  if (type === "GROUP" && teamId) {
    const existing = await db.thread.findFirst({ where: { type: "GROUP", teamId } });
    if (existing) return NextResponse.json(existing);

    const members = await db.user.findMany({ where: { teamId }, select: { id: true } });
    const thread = await db.thread.create({
      data: {
        type: "GROUP",
        teamId,
        members: { create: members.map((u) => ({ userId: u.id })) },
      },
    });
    return NextResponse.json(thread, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
