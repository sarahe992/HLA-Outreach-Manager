import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || !["LEADERSHIP", "LEAD_AMBASSADOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const feedback = await db.feedback.findMany({
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(feedback);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body } = await request.json();
  if (!body?.trim()) return NextResponse.json({ error: "Body required" }, { status: 400 });

  const feedback = await db.feedback.create({
    data: { userId: session.user.id, body: body.trim() },
  });
  return NextResponse.json(feedback, { status: 201 });
}
