import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createInAppNotification } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const announcements = await db.announcement.findMany({
    where: {
      recipients: {
        some: {
          OR: [
            { userId: session.user.id },
            { teamId: session.user.teamId ?? undefined },
            { userId: null, teamId: null },
          ],
        },
      },
    },
    include: { sender: { select: { name: true } }, recipients: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(announcements);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !["LEADERSHIP", "LEAD_AMBASSADOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { subject, body, targetType, targetIds } = await request.json();

  let recipientData: { userId?: string; teamId?: string }[] = [];

  if (session.user.role === "LEAD_AMBASSADOR") {
    const teamMembers = await db.user.findMany({
      where: { teamId: session.user.teamId ?? "__none__" },
      select: { id: true },
    });
    recipientData = teamMembers.map((u) => ({ userId: u.id }));
  } else if (targetType === "all") {
    recipientData = [{}];
  } else if (targetType === "teams") {
    recipientData = (targetIds as string[]).map((teamId) => ({ teamId }));
  } else if (targetType === "users") {
    recipientData = (targetIds as string[]).map((userId) => ({ userId }));
  }

  const announcement = await db.announcement.create({
    data: {
      senderId: session.user.id,
      subject,
      body,
      recipients: { create: recipientData },
    },
    include: { recipients: true },
  });

  const recipientUserIds: string[] = [];
  for (const r of announcement.recipients) {
    if (r.userId) {
      recipientUserIds.push(r.userId);
    } else if (r.teamId) {
      const members = await db.user.findMany({ where: { teamId: r.teamId }, select: { id: true } });
      recipientUserIds.push(...members.map((m) => m.id));
    } else {
      const all = await db.user.findMany({ select: { id: true } });
      recipientUserIds.push(...all.map((m) => m.id));
    }
  }

  await Promise.all(
    [...new Set(recipientUserIds)].map((uid) =>
      createInAppNotification(uid, "ANNOUNCEMENT", `New announcement: ${subject}`)
    )
  );

  return NextResponse.json(announcement, { status: 201 });
}
