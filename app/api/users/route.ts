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

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "LEADERSHIP") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userIds } = await request.json() as { userIds: string[] };
  const safeIds = userIds.filter((id) => id !== session.user.id);

  await db.$transaction(async (tx) => {
    for (const userId of safeIds) {
      await tx.notification.deleteMany({ where: { userId } });
      await tx.feedback.deleteMany({ where: { userId } });
      await tx.tablingSignup.deleteMany({ where: { userId } });
      await tx.announcementRecipient.deleteMany({ where: { userId } });
      await tx.threadMember.deleteMany({ where: { userId } });
      await tx.message.deleteMany({ where: { senderId: userId } });
      await tx.announcement.deleteMany({ where: { senderId: userId } });
      await tx.pitchingEvent.deleteMany({ where: { userId } });
      await tx.inviteToken.deleteMany({ where: { createdById: userId } });
      await tx.tablingEvent.deleteMany({ where: { createdById: userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    }
  });

  return NextResponse.json({ deleted: safeIds.length });
}
