import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  // Teams
  const [tanner, wilk, providers] = await Promise.all([
    db.team.upsert({ where: { id: "team-tanner" }, create: { id: "team-tanner", name: "Tanner Building Team" }, update: {} }),
    db.team.upsert({ where: { id: "team-wilk" }, create: { id: "team-wilk", name: "Wilk Team" }, update: {} }),
    db.team.upsert({ where: { id: "team-providers" }, create: { id: "team-providers", name: "Providers Team" }, update: {} }),
  ]);

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // Club Leadership
  await db.user.upsert({
    where: { email: "leadership@hla-byu.org" },
    create: {
      email: "leadership@hla-byu.org",
      name: "Sarah (Club President)",
      passwordHash: await hash("password123"),
      role: "LEADERSHIP",
    },
    update: {},
  });

  // Lead Ambassadors
  const lead1 = await db.user.upsert({
    where: { email: "lead1@hla-byu.org" },
    create: {
      email: "lead1@hla-byu.org",
      name: "Alex Lead",
      passwordHash: await hash("password123"),
      role: "LEAD_AMBASSADOR",
      teamId: tanner.id,
    },
    update: {},
  });

  const lead2 = await db.user.upsert({
    where: { email: "lead2@hla-byu.org" },
    create: {
      email: "lead2@hla-byu.org",
      name: "Jamie Lead",
      passwordHash: await hash("password123"),
      role: "LEAD_AMBASSADOR",
      teamId: wilk.id,
    },
    update: {},
  });

  // Ambassadors
  const amb1 = await db.user.upsert({
    where: { email: "amb1@hla-byu.org" },
    create: {
      email: "amb1@hla-byu.org",
      name: "Taylor Ambassador",
      passwordHash: await hash("password123"),
      role: "AMBASSADOR",
      teamId: tanner.id,
      major: "Pre-Med",
      graduationYear: "2027",
    },
    update: {},
  });

  await db.user.upsert({
    where: { email: "amb2@hla-byu.org" },
    create: {
      email: "amb2@hla-byu.org",
      name: "Jordan Ambassador",
      passwordHash: await hash("password123"),
      role: "AMBASSADOR",
      teamId: tanner.id,
      major: "Public Health",
      graduationYear: "2026",
    },
    update: {},
  });

  // Sample tabling event
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);
  tomorrow.setHours(10, 0, 0, 0);

  await db.tablingEvent.upsert({
    where: { id: "sample-tabling-1" },
    create: {
      id: "sample-tabling-1",
      teamId: tanner.id,
      location: "Tanner Building – Main Lobby",
      date: tomorrow,
      snackPlan: "Chocolate chip cookies from Smith's",
      createdById: lead1.id,
      slots: {
        create: [
          { startTime: new Date(tomorrow.getTime()), endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000) },
          { startTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), endTime: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000) },
        ],
      },
    },
    update: {},
  });

  // Sample pitching event
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  await db.pitchingEvent.upsert({
    where: { id: "sample-pitch-1" },
    create: {
      id: "sample-pitch-1",
      userId: amb1.id,
      className: "Econ 110",
      professorName: "Prof. Johnson",
      scheduledAt: nextWeek,
    },
    update: {},
  });

  // Group threads for each team
  for (const team of [tanner, wilk, providers]) {
    const existingThread = await db.thread.findFirst({ where: { type: "GROUP", teamId: team.id } });
    if (!existingThread) {
      const members = await db.user.findMany({ where: { teamId: team.id }, select: { id: true } });
      if (members.length > 0) {
        await db.thread.create({
          data: {
            type: "GROUP",
            teamId: team.id,
            members: { create: members.map((u) => ({ userId: u.id })) },
          },
        });
      }
    }
  }

  console.log("✅ Seed complete!");
  console.log("Test accounts (password: password123):");
  console.log("  Leadership: leadership@hla-byu.org");
  console.log("  Lead Amb:   lead1@hla-byu.org (Tanner) | lead2@hla-byu.org (Wilk)");
  console.log("  Ambassador: amb1@hla-byu.org | amb2@hla-byu.org");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
