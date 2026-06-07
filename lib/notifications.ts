import { db } from "./db";

export async function sendSMS(to: string, body: string) {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = (await import("twilio")).default;
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
    });
  } else {
    console.log(`[SMS STUB] To: ${to}\n${body}`);
  }
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "HLA <noreply@hla-byu.org>",
      to,
      subject,
      html,
    });
  } else {
    console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}\n${html}`);
  }
}

export async function createInAppNotification(
  userId: string,
  type: string,
  body: string
) {
  await db.notification.create({ data: { userId, type, body } });
}

export async function notifyNewAmbassador(name: string, teamId: string) {
  const [teamLeads, leadership] = await Promise.all([
    db.user.findMany({
      where: { teamId, role: "LEAD_AMBASSADOR" },
    }),
    db.user.findMany({
      where: { role: "LEADERSHIP" },
    }),
  ]);

  const recipients = [
    ...teamLeads,
    ...leadership.filter((l) => !teamLeads.some((tl) => tl.id === l.id)),
  ];

  const msg = `${name} just signed up and has been added to your team as an ambassador.`;

  for (const user of recipients) {
    await createInAppNotification(user.id, "NEW_AMBASSADOR", msg);
    if (user.email)
      await sendEmail(user.email, "New Ambassador Joined", `<p>${msg}</p>`);
  }
}

export async function notifyTablingCancellation(
  cancellerName: string,
  slotId: string
) {
  const slot = await db.tablingSlot.findUnique({
    where: { id: slotId },
    include: { tablingEvent: { include: { team: { include: { users: true } } } } },
  });
  if (!slot) return;

  const leads = slot.tablingEvent.team.users.filter(
    (u) => u.role === "LEAD_AMBASSADOR"
  );
  const msg = `${cancellerName} cancelled their tabling slot on ${slot.startTime.toLocaleDateString()} (${slot.startTime.toLocaleTimeString()} – ${slot.endTime.toLocaleTimeString()}).`;

  for (const lead of leads) {
    await createInAppNotification(lead.id, "TABLING_CANCEL", msg);
    if (lead.phone) await sendSMS(lead.phone, `[HLA] ${msg}`);
    if (lead.email)
      await sendEmail(lead.email, "Ambassador Cancelled Tabling Slot", `<p>${msg}</p>`);
  }
}
