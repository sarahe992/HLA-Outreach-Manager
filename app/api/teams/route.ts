import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const teams = await db.team.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(teams);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "LEADERSHIP") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const team = await db.team.create({ data: { name } });
  return NextResponse.json(team, { status: 201 });
}
