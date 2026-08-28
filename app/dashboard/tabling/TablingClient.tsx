"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MapPin, Calendar, Users, CheckSquare } from "lucide-react";
import type { Role } from "@prisma/client";

interface Slot { id: string; startTime: string; endTime: string; signups: unknown[] }
interface Event {
  id: string; location: string; date: string; snackPlan?: string;
  team?: { name: string }; slots: Slot[];
  postData?: { studentsReached: number; ambassadorsShowed: number; totalHours: number };
}

interface Props {
  events: Event[];
  teams: { id: string; name: string }[];
  role: Role;
  userTeamId: string | null;
}

export default function TablingClient({ events, teams, role, userTeamId }: Props) {
  const router = useRouter();
  const canCreate = role === "LEAD_AMBASSADOR" || role === "LEADERSHIP";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    location: "", date: "", snackPlan: "", teamId: userTeamId ?? "",
    eventStart: "", eventEnd: "",
  });
  const [loading, setLoading] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDeleteSelected() {
    if (!confirm(`Delete ${selected.size} tabling event${selected.size > 1 ? "s" : ""}?`)) return;
    setDeleting(true);
    await Promise.all([...selected].map((id) => fetch(`/api/tabling/${id}`, { method: "DELETE" })));
    exitSelectMode();
    setDeleting(false);
    router.refresh();
  }

  function generate15MinSlots(start: string, end: string) {
    const slots: { startTime: string; endTime: string }[] = [];
    let cur = new Date(start);
    const endDate = new Date(end);
    while (cur < endDate) {
      const next = new Date(cur.getTime() + 15 * 60 * 1000);
      slots.push({ startTime: cur.toISOString(), endTime: (next <= endDate ? next : endDate).toISOString() });
      cur = next;
    }
    return slots;
  }

  const slotPreviewCount =
    form.eventStart && form.eventEnd && new Date(form.eventEnd) > new Date(form.eventStart)
      ? generate15MinSlots(form.eventStart, form.eventEnd).length
      : 0;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (slotPreviewCount === 0) return;
    setLoading(true);
    await fetch("/api/tabling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: form.location,
        snackPlan: form.snackPlan,
        teamId: form.teamId,
        date: form.date ? `${form.date}T12:00:00.000Z` : form.date,
        slots: generate15MinSlots(form.eventStart, form.eventEnd),
      }),
    });
    setLoading(false);
    setOpen(false);
    setForm({ location: "", date: "", snackPlan: "", teamId: userTeamId ?? "", eventStart: "", eventEnd: "" });
    router.refresh();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hla-900">Tabling Events</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} event{events.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && selectMode && (
            <>
              {selected.size > 0 && (
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={deleting}>
                  {deleting ? "Deleting…" : `Delete (${selected.size})`}
                </Button>
              )}
              <Button variant="outline" onClick={exitSelectMode}>Cancel</Button>
            </>
          )}
          {canCreate && !selectMode && (
            <Button variant="outline" onClick={() => setSelectMode(true)}>
              <CheckSquare className="h-4 w-4 mr-1" /> Select
            </Button>
          )}
          {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> New Tabling Event</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Tabling Event</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input placeholder="Tanner Building – Atrium" value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
                </div>
                {role === "LEADERSHIP" && (
                  <div className="space-y-1.5">
                    <Label>Team</Label>
                    <Select onValueChange={(v) => setForm((p) => ({ ...p, teamId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select team…" /></SelectTrigger>
                      <SelectContent>
                        {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Snack Plan</Label>
                  <Input placeholder="Chocolate chip cookies from Smith's" value={form.snackPlan}
                    onChange={(e) => setForm((p) => ({ ...p, snackPlan: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Event Time</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Start</p>
                      <Input type="datetime-local" value={form.eventStart}
                        onChange={(e) => setForm((p) => ({ ...p, eventStart: e.target.value }))} required />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">End</p>
                      <Input type="datetime-local" value={form.eventEnd}
                        onChange={(e) => setForm((p) => ({ ...p, eventEnd: e.target.value }))} required />
                    </div>
                  </div>
                  {slotPreviewCount > 0 && (
                    <p className="text-xs text-hla-600 font-medium">
                      → {slotPreviewCount} sign-up slot{slotPreviewCount !== 1 ? "s" : ""} of 15 min each
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating…" : "Create Event"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => {
          const signedUp = event.slots.reduce((s, sl) => s + (sl.signups?.length ?? 0), 0);
          return (
            <div key={event.id} className="relative">
              {canCreate && selectMode && (
                <input
                  type="checkbox"
                  checked={selected.has(event.id)}
                  onChange={() => toggleSelect(event.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-3 left-3 z-10 h-4 w-4 cursor-pointer"
                />
              )}
            <Link href={`/dashboard/tabling/${event.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{event.location}</CardTitle>
                    {role === "AMBASSADOR" ? (
                      new Date(event.date) >= new Date() ? <Badge variant="tabling">Upcoming</Badge> : null
                    ) : event.postData ? (
                      <Badge variant="secondary">Logged</Badge>
                    ) : new Date(event.date) < new Date() ? (
                      <Badge variant="outline">Completed</Badge>
                    ) : (
                      <Badge variant="tabling">Upcoming</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-hla-400" />
                    {format(new Date(event.date), "MMMM d, yyyy")}
                  </div>
                  {event.team && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-hla-400" />
                      {event.team.name}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-hla-400" />
                    {signedUp} ambassador{signedUp !== 1 ? "s" : ""} signed up
                  </div>
                  {event.postData && (
                    <div className="pt-1 border-t border-hla-100 text-xs space-y-0.5">
                      <p>{event.postData.studentsReached} students reached</p>
                      <p>{event.postData.totalHours}h tabled</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
            </div>
          );
        })}
        {events.length === 0 && (
          <p className="text-gray-400 text-sm col-span-3">No tabling events yet.</p>
        )}
      </div>
    </div>
  );
}
