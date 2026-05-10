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
import { Plus, MapPin, Calendar, Users } from "lucide-react";
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
    slots: [{ startTime: "", endTime: "" }],
  });
  const [loading, setLoading] = useState(false);

  function addSlot() {
    setForm((p) => ({ ...p, slots: [...p.slots, { startTime: "", endTime: "" }] }));
  }

  function updateSlot(i: number, field: "startTime" | "endTime", value: string) {
    setForm((p) => {
      const slots = [...p.slots];
      slots[i] = { ...slots[i], [field]: value };
      return { ...p, slots };
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/tabling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date: form.date ? `${form.date}T12:00:00.000Z` : form.date,
        slots: form.slots.map((s) => ({
          startTime: s.startTime ? new Date(s.startTime).toISOString() : "",
          endTime: s.endTime ? new Date(s.endTime).toISOString() : "",
        })),
      }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hla-900">Tabling Events</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} event{events.length !== 1 ? "s" : ""}</p>
        </div>
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
                  <Label>Time Slots</Label>
                  {form.slots.map((slot, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <Input type="datetime-local" value={slot.startTime}
                        onChange={(e) => updateSlot(i, "startTime", e.target.value)} required />
                      <Input type="datetime-local" value={slot.endTime}
                        onChange={(e) => updateSlot(i, "endTime", e.target.value)} required />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                    + Add Slot
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating…" : "Create Event"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => {
          const signedUp = event.slots.reduce((s, sl) => s + (sl.signups?.length ?? 0), 0);
          return (
            <Link key={event.id} href={`/dashboard/tabling/${event.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{event.location}</CardTitle>
                    {event.postData ? (
                      <Badge variant="secondary">Logged</Badge>
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
          );
        })}
        {events.length === 0 && (
          <p className="text-gray-400 text-sm col-span-3">No tabling events yet.</p>
        )}
      </div>
    </div>
  );
}
