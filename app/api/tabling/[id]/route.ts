import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const event = await db.tablingEvent.findUnique({
    where: { id },
    include: {
      team: true,
      slots: {
        include: {
          signups: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
        orderBy: { startTime: "asc" },
      },
      postData: true,
      createdBy: { select: { name: true } },
    },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !["LEADERSHIP", "LEAD_AMBASSADOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await db.tablingEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
