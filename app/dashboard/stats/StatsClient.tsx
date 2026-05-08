"use client";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart3, Users, Clock, BookOpen } from "lucide-react";
import type { Role } from "@prisma/client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-hla-100 flex items-center justify-center">
          <Icon className="h-5 w-5 text-hla-700" />
        </div>
        <div>
          <p className="text-2xl font-bold text-hla-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatsClient({ role }: { role: Role }) {
  const { data, isLoading } = useSWR("/api/stats", fetcher, { refreshInterval: 30000 });

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-hla-900 mb-6">KPI Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (role === "AMBASSADOR") {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-hla-900">My Stats</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Tabling Events Attended" value={data.tablingEventsAttended} icon={BarChart3} />
          <StatCard label="Pitching Events Logged" value={data.pitchingEventsLogged} icon={BookOpen} />
          <StatCard label="Total Hours" value={`${data.totalHours}h`} icon={Clock} />
          <StatCard label="Students Reached" value={data.studentsReached} icon={Users} />
        </div>
      </div>
    );
  }

  if (role === "LEAD_AMBASSADOR") {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-hla-900">Team Stats</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Tabling Events" value={data.team.tablingEvents} icon={BarChart3} />
          <StatCard label="Pitching Events" value={data.team.pitchingEvents} icon={BookOpen} />
          <StatCard label="Total Hours" value={`${data.team.totalHours}h`} icon={Clock} />
          <StatCard label="Students Reached" value={data.team.studentsReached} icon={Users} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-hla-900 mb-3">Ambassador Breakdown</h2>
          <div className="bg-white rounded-xl border border-hla-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-hla-50">
                <tr>
                  {["Ambassador", "Events", "Pitches", "Hours", "Students"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-hla-800 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.ambassadors?.map((a: { id: string; name: string; eventsAttended: number; pitchingLogged: number; totalHours: number; studentsReached: number }) => (
                  <tr key={a.id} className="border-t border-hla-50 hover:bg-hla-50/50">
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-gray-600">{a.eventsAttended}</td>
                    <td className="px-4 py-3 text-gray-600">{a.pitchingLogged}</td>
                    <td className="px-4 py-3 text-gray-600">{a.totalHours}h</td>
                    <td className="px-4 py-3 text-gray-600">{a.studentsReached}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // LEADERSHIP
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-hla-900">Org-Wide KPI Dashboard</h1>
        <Button variant="secondary" onClick={() => window.open("/api/export", "_blank")}>
          <Download className="h-4 w-4 mr-1" /> Export Excel
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tabling Events" value={data.orgWide.tablingEvents} icon={BarChart3} />
        <StatCard label="Total Pitching Events" value={data.orgWide.pitchingEvents} icon={BookOpen} />
        <StatCard label="Total Hours" value={`${data.orgWide.totalHours}h`} icon={Clock} />
        <StatCard label="Students Reached" value={data.orgWide.studentsReached} icon={Users} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-hla-900 mb-3">By Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.teams?.map((t: { id: string; name: string; tablingEvents: number; pitchingEvents: number; totalHours: number; studentsReached: number }) => (
            <Card key={t.id}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{t.name}</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1 text-gray-600">
                <p>{t.tablingEvents} tabling · {t.pitchingEvents} pitching</p>
                <p>{t.totalHours}h tabled · {t.studentsReached} students</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-hla-900 mb-3">Ambassador Leaderboard</h2>
        <div className="bg-white rounded-xl border border-hla-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-hla-50">
              <tr>
                {["Ambassador", "Team", "Events", "Pitches", "Hours", "Students"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-hla-800 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.ambassadors?.map((a: { id: string; name: string; teamName: string; eventsAttended: number; pitchingLogged: number; totalHours: number; studentsReached: number }) => (
                <tr key={a.id} className="border-t border-hla-50 hover:bg-hla-50/50">
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3 text-gray-500">{a.teamName}</td>
                  <td className="px-4 py-3 text-gray-600">{a.eventsAttended}</td>
                  <td className="px-4 py-3 text-gray-600">{a.pitchingLogged}</td>
                  <td className="px-4 py-3 text-gray-600">{a.totalHours}h</td>
                  <td className="px-4 py-3 text-gray-600">{a.studentsReached}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
