import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { notifyNewAmbassador } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const {
    name, email, phone, password,
    yearInSchool, fieldOfStudy, major, heardAboutHla,
  } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    if (!existing.accountClaimed) {
      // Pre-imported ambassador claiming their account — set their password and update info
      const passwordHash = await bcrypt.hash(password, 12);
      await db.user.update({
        where: { id: existing.id },
        data: {
          name,
          phone: phone || existing.phone,
          passwordHash,
          accountClaimed: true,
          yearInSchool: yearInSchool || existing.yearInSchool,
          fieldOfStudy: fieldOfStudy || existing.fieldOfStudy,
          major: major || existing.major,
          heardAboutHla: heardAboutHla || existing.heardAboutHla,
        },
      });
      return NextResponse.json({ id: existing.id, claimed: true }, { status: 200 });
    }

    // Real duplicate — account already fully set up
    return NextResponse.json({ error: "already_claimed" }, { status: 409 });
  }

  // New user — auto-assign to team with fewest members
  const teams = await db.team.findMany({
    where: { isArchived: false },
    include: { _count: { select: { users: true } } },
  });
  const assignedTeam = teams.sort((a, b) => a._count.users - b._count.users)[0] ?? null;

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: {
      name, email,
      phone: phone || null,
      passwordHash,
      role: "AMBASSADOR",
      accountClaimed: true,
      teamId: assignedTeam?.id ?? null,
      yearInSchool: yearInSchool || null,
      fieldOfStudy: fieldOfStudy || null,
      major: major || null,
      heardAboutHla: heardAboutHla || null,
    },
  });

  if (assignedTeam) {
    await notifyNewAmbassador(name, assignedTeam.id);
  }

  return NextResponse.json({ id: user.id }, { status: 201 });
}
