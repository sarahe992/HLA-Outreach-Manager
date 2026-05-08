"use client";
import { useMemo } from "react";
import { Calendar, dateFnsLocalizer, type Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@prisma/client";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "en-US": enUS },
});

interface CalEvent extends Event {
  type: "tabling" | "pitching";
  id: string;
}

interface Props {
  tablingEvents: { id: string; date: string; location: string; team?: { name: string } }[];
  pitchingEvents: { id: string; scheduledAt: string; className: string; user?: { name: string } }[];
  role: Role;
}

export default function CalendarClient({ tablingEvents, pitchingEvents, role }: Props) {
  const router = useRouter();

  const events: CalEvent[] = useMemo(() => [
    ...tablingEvents.map((e) => ({
      id: e.id,
      type: "tabling" as const,
      title: `📋 Tabling – ${e.location}${e.team ? ` (${e.team.name})` : ""}`,
      start: new Date(e.date),
      end: new Date(e.date),
      allDay: true,
    })),
    ...pitchingEvents.map((e) => ({
      id: e.id,
      type: "pitching" as const,
      title: `🎤 Pitch – ${e.className}${e.user ? ` by ${e.user.name}` : ""}`,
      start: new Date(e.scheduledAt),
      end: new Date(e.scheduledAt),
      allDay: false,
    })),
  ], [tablingEvents, pitchingEvents]);

  function eventStyleGetter(event: CalEvent) {
    const style =
      event.type === "tabling"
        ? { backgroundColor: "#1c2fd6", color: "#fff", borderRadius: "6px", border: "none" }
        : { backgroundColor: "#059669", color: "#fff", borderRadius: "6px", border: "none" };
    return { style };
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-hla-900">Calendar</h1>
        <div className="flex items-center gap-3">
          <Badge variant="tabling">Tabling</Badge>
          <Badge variant="pitching">Pitching</Badge>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-hla-100 p-4" style={{ height: 680 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(e) => {
            const ev = e as CalEvent;
            if (ev.type === "tabling") router.push(`/dashboard/tabling/${ev.id}`);
            else router.push(`/dashboard/pitching/${ev.id}`);
          }}
          style={{ height: "100%" }}
        />
      </div>
      {(role === "LEAD_AMBASSADOR" || role === "LEADERSHIP") && (
        <p className="text-sm text-gray-500">
          Click any tabling event to view details and manage sign-ups.
        </p>
      )}
    </div>
  );
}
