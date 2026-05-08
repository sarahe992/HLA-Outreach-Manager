import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import TablingDetailClient from "./TablingDetailClient";

export default async function TablingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const event = await db.tablingEvent.findUnique({
    where: { id },
    include: {
      team: true,
      slots: {
        include: {
          signups: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
        orderBy: { startTime: "asc" },
      },
      postData: true,
      createdBy: { select: { name: true } },
    },
  });

  if (!event) notFound();

  return (
    <TablingDetailClient
      event={JSON.parse(JSON.stringify(event))}
      role={session.user.role}
      userId={session.user.id}
    />
  );
}
