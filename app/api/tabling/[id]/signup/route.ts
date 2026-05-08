import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createInAppNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slotId } = await request.json();
  const { id: _eventId } = await params;

  const existing = await db.tablingSignup.findUnique({
    where: { slotId_userId: { slotId, userId: session.user.id } },
  });

  if (existing && !existing.cancelledAt) {
    return NextResponse.json({ error: "Already signed up." }, { status: 409 });
  }

  if (existing) {
    await db.tablingSignup.update({
      where: { id: existing.id },
      data: { cancelledAt: null },
    });
  } else {
    await db.tablingSignup.create({ data: { slotId, userId: session.user.id } });
  }

  await createInAppNotification(
    session.user.id,
    "TABLING_SIGNUP",
    "You have successfully signed up for a tabling slot."
  );

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slotId } = await request.json();
  const { id: _eventId } = await params;

  await db.tablingSignup.updateMany({
    where: { slotId, userId: session.user.id, cancelledAt: null },
    data: { cancelledAt: new Date() },
  });

  const { notifyTablingCancellation } = await import("@/lib/notifications");
  await notifyTablingCancellation(session.user.name, slotId);

  return NextResponse.json({ success: true });
}
