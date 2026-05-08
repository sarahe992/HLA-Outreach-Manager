import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { name, email, phone, password, teamId, graduationYear, major } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      role: "AMBASSADOR",
      teamId: teamId || null,
      graduationYear: graduationYear || null,
      major: major || null,
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
