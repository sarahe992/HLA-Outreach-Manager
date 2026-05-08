"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, CheckCircle } from "lucide-react";
import type { Role } from "@prisma/client";

interface PitchEvent {
  id: string; className: string; professorName: string; scheduledAt: string;
  studentCount?: number; isCompleted: boolean;
  user?: { name: string; team?: { name: string } };
}

interface Props { events: PitchEvent[]; role: Role; userId: string }

export default function PitchingClient({ events, role }: Props) {
  const router = useRouter();
  const canCreate = role === "AMBASSADOR";
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<PitchEvent | null>(null);
  const [form, setForm] = useState({ className: "", professorName: "", scheduledAt: "" });
  const [editForm, setEditForm] = useState({ className: "", professorName: "", scheduledAt: "", studentCount: "", isCompleted: false });

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/pitching", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreateOpen(false);
    setForm({ className: "", professorName: "", scheduledAt: "" });
    router.refresh();
  }

  function openEdit(event: PitchEvent) {
    setEditEvent(event);
    setEditForm({
      className: event.className,
      professorName: event.professorName,
      scheduledAt: new Date(event.scheduledAt).toISOString().slice(0, 16),
      studentCount: event.studentCount?.toString() ?? "",
      isCompleted: event.isCompleted,
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editEvent) return;
    await fetch(`/api/pitching/${editEvent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        studentCount: editForm.studentCount ? Number(editForm.studentCount) : null,
      }),
    });
    setEditEvent(null);
    router.refresh();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hla-900">Pitching Events</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} event{events.length !== 1 ? "s" : ""}</p>
        </div>
        {canCreate && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Log Pitch</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log a Pitching Event</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Class Name</Label>
                  <Input placeholder="Econ 110" value={form.className} onChange={set("className")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Professor Name</Label>
                  <Input placeholder="Prof. Smith" value={form.professorName} onChange={set("professorName")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Date & Time</Label>
                  <Input type="datetime-local" value={form.scheduledAt} onChange={set("scheduledAt")} required />
                </div>
                <Button type="submit" className="w-full">Log Pitch</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editEvent} onOpenChange={(o) => !o && setEditEvent(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Pitching Event</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Class Name</Label>
              <Input value={editForm.className} onChange={(e) => setEditForm((p) => ({ ...p, className: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Professor</Label>
              <Input value={editForm.professorName} onChange={(e) => setEditForm((p) => ({ ...p, professorName: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Date & Time</Label>
              <Input type="datetime-local" value={editForm.scheduledAt} onChange={(e) => setEditForm((p) => ({ ...p, scheduledAt: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Class Size (post-event)</Label>
              <Input type="number" min={0} placeholder="Leave blank if not yet completed"
                value={editForm.studentCount} onChange={(e) => setEditForm((p) => ({ ...p, studentCount: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={editForm.isCompleted}
                onChange={(e) => setEditForm((p) => ({ ...p, isCompleted: e.target.checked }))} />
              Mark as completed
            </label>
            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-hla-900">{event.className}</p>
                  <Badge variant={event.isCompleted ? "pitching" : "outline"}>
                    {event.isCompleted ? "Completed" : "Upcoming"}
                  </Badge>
                  {event.user && (
                    <span className="text-xs text-gray-500">
                      {event.user.name}{event.user.team ? ` · ${event.user.team.name}` : ""}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">Prof. {event.professorName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(event.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
                  {event.studentCount != null && ` · ${event.studentCount} students`}
                </p>
              </div>
              {role === "AMBASSADOR" && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(event)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!event.isCompleted && (
                    <Button variant="outline" size="sm" onClick={() => {
                      openEdit(event);
                      setEditForm((p) => ({ ...p, isCompleted: true }));
                    }}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Complete
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {events.length === 0 && (
          <p className="text-gray-400 text-sm">No pitching events yet.</p>
        )}
      </div>
    </div>
  );
}
