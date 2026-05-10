import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

function isEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  const DEFAULT_PASSWORD = "HLA2026!";
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const csvPath = path.join(process.cwd(), "prisma", "ambassadors.csv");
  const content = fs.readFileSync(csvPath, "utf-8").replace(/^﻿/, "");
  const lines = content.split("\n");

  let created = 0;
  let skipped = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);

    const rowNum = cols[0];
    if (!rowNum || isNaN(Number(rowNum))) continue;

    const nameField = cols[5] ?? "";
    const emailOrLastName = cols[6] ?? "";
    const phoneRaw = cols[7] ?? "";
    const yearInSchool = cols[8] ?? "";
    const college = cols[9] ?? "";
    const businessMajor = cols[10] ?? "";

    if (!isEmail(emailOrLastName)) {
      console.log(`Skipping row ${rowNum}: ${nameField} — no email found`);
      skipped++;
      continue;
    }

    const name = nameField;
    const email = emailOrLastName.toLowerCase();
    const phone = cleanPhone(phoneRaw);
    const major = businessMajor || college || null;

    try {
      await db.user.upsert({
        where: { email },
        create: {
          name,
          email,
          phone: phone || null,
          passwordHash: hash,
          role: "AMBASSADOR",
          graduationYear: yearInSchool || null,
          major: major || null,
        },
        update: {},
      });
      console.log(`✓ ${name} (${email})`);
      created++;
    } catch (err) {
      console.error(`✗ Failed: ${name} (${email})`, err);
      skipped++;
    }
  }

  console.log(`\n✅ Done! Created: ${created}, Skipped: ${skipped}`);
  console.log(`Default password for all imported users: ${DEFAULT_PASSWORD}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
