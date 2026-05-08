import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { threadId } = await params;

  const member = await db.threadMember.findUnique({
    where: { threadId_userId: { threadId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const messages = await db.message.findMany({
    where: { threadId },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { threadId } = await params;

  const member = await db.threadMember.findUnique({
    where: { threadId_userId: { threadId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { body } = await request.json();
  const message = await db.message.create({
    data: { threadId, senderId: session.user.id, body },
    include: { sender: { select: { id: true, name: true } } },
  });
  return NextResponse.json(message, { status: 201 });
}
