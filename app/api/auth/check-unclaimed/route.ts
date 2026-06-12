import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ unclaimed: false });

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { accountClaimed: true },
  });

  return NextResponse.json({ unclaimed: user?.accountClaimed === false });
}
