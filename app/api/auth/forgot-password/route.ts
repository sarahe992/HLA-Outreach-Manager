import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  const user = await db.user.findUnique({ where: { email } });

  // Always return success so we don't reveal whether an email is registered
  if (!user) return NextResponse.json({ ok: true });

  // Expire any existing unused tokens for this user
  await db.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = await db.passwordResetToken.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token.token}`;

  await sendEmail(
    user.email,
    "Reset your HLA password",
    `<p>Hi ${user.name},</p>
     <p>Click the link below to reset your password. This link expires in 1 hour.</p>
     <p><a href="${resetUrl}">${resetUrl}</a></p>
     <p>If you didn't request this, you can ignore this email.</p>`
  );

  return NextResponse.json({ ok: true });
}
