import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import SessionProvider from "@/components/SessionProvider";
import FeedbackButton from "@/components/FeedbackButton";
import WelcomeNotice from "@/components/WelcomeNotice";
import { db } from "@/lib/db";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          role={session.user.role}
          userName={session.user.name}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto bg-[#f8f9fb]">
          {children}
          <WelcomeNotice />
          <FeedbackButton />
        </main>
      </div>
    </SessionProvider>
  );
}
