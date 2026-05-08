import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !["LEADERSHIP", "LEAD_AMBASSADOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { studentsReached, ambassadorsShowed, totalHours } = await request.json();

  const postData = await db.tablingPostData.upsert({
    where: { tablingEventId: id },
    create: { tablingEventId: id, studentsReached, ambassadorsShowed, totalHours },
    update: { studentsReached, ambassadorsShowed, totalHours },
  });
  return NextResponse.json(postData);
}
