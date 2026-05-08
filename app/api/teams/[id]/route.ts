import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "LEADERSHIP") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const team = await db.team.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      isArchived: body.isArchived ?? undefined,
    },
  });
  return NextResponse.json(team);
}
