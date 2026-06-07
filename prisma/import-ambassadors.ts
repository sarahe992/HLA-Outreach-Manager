import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

// Column mapping (0-indexed):
// 0:  row ID
// 5:  full name (sometimes first-name only if name had a comma)
// 6:  email (or last name if name was split — skip if not an email)
// 7:  phone
// 8:  year in school
// 9:  field of study
// 10: Column11     — business major (primary) / misc notes
// 11: named col    — business major (duplicate/confirmation)
// 12: Column12     — medical career
// 13: Column13     — other major / secondary field
// 14: Column14     — how did you hear about HLA
// 15: Column15     — why (not stored)

function isEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

function cleanPhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuotes = !inQuotes; }
    else if (c === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += c; }
  }
  result.push(current.trim());
  return result;
}

function deriveFieldAndMajor(cols: string[]): { fieldOfStudy: string | null; major: string | null } {
  const raw = cols[9]?.trim() || null;
  if (!raw) return { fieldOfStudy: null, major: null };

  if (raw === "Business") {
    return { fieldOfStudy: "Business", major: cols[10]?.trim() || cols[11]?.trim() || null };
  }
  if (raw === "Medical") {
    return { fieldOfStudy: "Medical", major: cols[12]?.trim() || null };
  }
  if (raw === "Public Health") {
    return { fieldOfStudy: "Public Health", major: cols[13]?.trim() || null };
  }
  if (raw === "Other") {
    return { fieldOfStudy: "Other", major: cols[13]?.trim() || cols[10]?.trim() || null };
  }

  // Non-standard field (Chemical Engineering, Nursing, Dental, etc.) — store as "Other"
  // and use the raw value or cols[13] as the major
  return { fieldOfStudy: "Other", major: cols[13]?.trim() || raw };
}

async function main() {
  // Randomly generated password — users cannot log in until they claim their
  // account via /register, which sets a real password and flips accountClaimed = true
  const hash = await bcrypt.hash(crypto.randomUUID(), 12);

  // Load teams and track assignment counts locally so we can balance as we go
  const teamsRaw = await db.team.findMany({
    where: { isArchived: false },
    include: { _count: { select: { users: true } } },
  });
  const teams = teamsRaw.map((t) => ({ id: t.id, name: t.name, count: t._count.users }));

  if (teams.length === 0) {
    console.log("⚠️  No teams found — users will be imported without team assignment.\n");
  }

  const csvPath = path.join(process.cwd(), "prisma", "ambassadors.csv");
  const content = fs.readFileSync(csvPath, "utf-8").replace(/^﻿/, ""); // strip BOM
  const lines = content.split("\n");

  let created = 0;
  let alreadyExists = 0;
  let skipped = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);

    // Only process numbered data rows
    const rowNum = cols[0]?.trim();
    if (!rowNum || isNaN(Number(rowNum))) continue;

    const name = cols[5]?.trim() ?? "";
    const emailField = cols[6]?.trim() ?? "";
    const phoneRaw = cols[7]?.trim() ?? "";
    const yearInSchool = cols[8]?.trim() || null;
    const heardAboutHla = cols[14]?.trim() || null;

    if (!isEmail(emailField)) {
      console.log(`⏭  Row ${rowNum}: "${name} ${emailField}" — no valid email, skipping`);
      skipped++;
      continue;
    }

    const email = emailField.toLowerCase();
    const phone = cleanPhone(phoneRaw) || null;
    const { fieldOfStudy, major } = deriveFieldAndMajor(cols);

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`⚠️  Row ${rowNum}: ${name} (${email}) — already in system`);
      alreadyExists++;
      continue;
    }

    // Assign to team with fewest members
    teams.sort((a, b) => a.count - b.count);
    const team = teams[0] ?? null;

    try {
      await db.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash: hash,
          role: "AMBASSADOR",
          accountClaimed: false,
          teamId: team?.id ?? null,
          yearInSchool,
          fieldOfStudy,
          major: major || null,
          heardAboutHla,
        },
      });
      if (team) team.count++;
      console.log(`✅ ${name} (${email}) → ${team?.name ?? "no team"}`);
      created++;
    } catch (err) {
      console.error(`✗  Row ${rowNum}: ${name} — failed`, err);
      skipped++;
    }
  }

  console.log(`\n── Import complete ──────────────────`);
  console.log(`   Created:        ${created}`);
  console.log(`   Already existed: ${alreadyExists}`);
  console.log(`   Skipped:        ${skipped}`);
  console.log(`────────────────────────────────────`);
  console.log(`\nThese users cannot log in yet. They must go to /register`);
  console.log(`and enter their email to claim their account and set a password.`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
