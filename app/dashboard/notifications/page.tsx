"use client";
import useSWR from "swr";
import { format } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Notification { id: string; type: string; body: string; isRead: boolean; createdAt: string }

export default function NotificationsPage() {
  const { data: notifications, mutate } = useSWR<Notification[]>("/api/notifications", fetcher, { refreshInterval: 15000 });

  async function markAllRead() {
    const unread = notifications?.filter((n) => !n.isRead).map((n) => n.id) ?? [];
    if (!unread.length) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unread }),
    });
    mutate();
  }

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-hla-900">Notifications</h1>
        {notifications?.some((n) => !n.isRead) && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {notifications?.map((n) => (
          <div
            key={n.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border transition-colors",
              n.isRead ? "border-hla-100 bg-white" : "border-hla-200 bg-hla-50"
            )}
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", n.isRead ? "bg-gray-100" : "bg-hla-100")}>
              <Bell className={cn("h-4 w-4", n.isRead ? "text-gray-400" : "text-hla-700")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{n.body}</p>
              <p className="text-xs text-gray-400 mt-0.5">{format(new Date(n.createdAt), "MMM d 'at' h:mm a")}</p>
            </div>
            {!n.isRead && <span className="w-2 h-2 rounded-full bg-hla-600 mt-1.5 flex-shrink-0" />}
          </div>
        ))}
        {notifications?.length === 0 && (
          <p className="text-gray-400 text-sm">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
