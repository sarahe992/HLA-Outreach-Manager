import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const event = await db.pitchingEvent.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "AMBASSADOR" && event.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updated = await db.pitchingEvent.update({
    where: { id },
    data: {
      className: body.className ?? undefined,
      professorName: body.professorName ?? undefined,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      studentCount: body.studentCount ?? undefined,
      isCompleted: body.isCompleted ?? undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const event = await db.pitchingEvent.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "AMBASSADOR" && event.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db.pitchingEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
