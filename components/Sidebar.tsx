"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CalendarDays, ClipboardList, Presentation, MessageSquare,
  BarChart3, BookOpen, Settings, Users, LogOut, Bell, Lightbulb, Award, UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
}

const nav: NavItem[] = [
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/tabling", label: "Tabling", icon: ClipboardList },
  { href: "/dashboard/pitching", label: "Pitching", icon: Presentation },
  { href: "/dashboard/messaging", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/stats", label: "Stats", icon: BarChart3 },
  { href: "/dashboard/expectations", label: "Expectations", icon: Award },
  { href: "/dashboard/recruit", label: "Recruit", icon: UserPlus },
  { href: "/dashboard/guidelines", label: "Guidelines", icon: BookOpen, roles: ["LEAD_AMBASSADOR", "LEADERSHIP"] },
  { href: "/dashboard/admin/teams", label: "Teams", icon: Settings, roles: ["LEADERSHIP"] },
  { href: "/dashboard/admin/users", label: "Users", icon: Users, roles: ["LEADERSHIP", "LEAD_AMBASSADOR"] },
  { href: "/dashboard/admin/feedback", label: "Feedback", icon: Lightbulb, roles: ["LEADERSHIP", "LEAD_AMBASSADOR"] },
];

interface SidebarProps {
  role: Role;
  userName: string;
  unreadCount: number;
}

export default function Sidebar({ role, userName, unreadCount }: SidebarProps) {
  const pathname = usePathname();

  const items = nav.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-hla-950 text-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gold-500 font-bold text-hla-950 text-sm">
          HLA
        </div>
        <div>
          <p className="font-semibold text-sm leading-tight">HLA Outreach</p>
          <p className="text-hla-300 text-xs leading-tight">Manager</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-hla-700 text-white font-semibold"
                  : "text-hla-300 hover:bg-hla-800 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
              {item.href === "/dashboard/messaging" && unreadCount > 0 && (
                <span className="ml-auto bg-gold-500 text-hla-950 text-xs font-bold rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10 space-y-1">
        <Link
          href="/dashboard/notifications"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-hla-300 hover:bg-hla-800 hover:text-white transition-colors"
        >
          <Bell className="h-4 w-4" />
          Notifications
        </Link>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-hla-600 flex items-center justify-center text-xs font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-hla-400 text-xs capitalize">{role.replace("_", " ").toLowerCase()}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-hla-400 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
