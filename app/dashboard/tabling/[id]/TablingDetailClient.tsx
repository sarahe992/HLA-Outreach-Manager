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
import { MapPin, Calendar, Cookie, ChevronLeft, CheckCircle, XCircle } from "lucide-react";
import type { Role } from "@prisma/client";

interface Signup { id: string; cancelledAt: string | null; user: { id: string; name: string } }
interface Slot { id: string; startTime: string; endTime: string; signups: Signup[] }
interface Event {
  id: string; location: string; date: string; snackPlan?: string;
  team?: { name: string }; slots: Slot[];
  createdBy: { name: string };
  postData?: { studentsReached: number; ambassadorsShowed: number; totalHours: number };
}

interface Props { event: Event; role: Role; userId: string }

export default function TablingDetailClient({ event, role, userId }: Props) {
  const router = useRouter();
  const canEdit = role === "LEAD_AMBASSADOR" || role === "LEADERSHIP";
  const [postForm, setPostForm] = useState({
    studentsReached: event.postData?.studentsReached ?? "",
    ambassadorsShowed: event.postData?.ambassadorsShowed ?? "",
    totalHours: event.postData?.totalHours ?? "",
  });
  const [postOpen, setPostOpen] = useState(false);
  const [loadingSlot, setLoadingSlot] = useState<string | null>(null);

  async function handleSignup(slotId: string) {
    setLoadingSlot(slotId);
    await fetch(`/api/tabling/${event.id}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId }),
    });
    setLoadingSlot(null);
    router.refresh();
  }

  async function handleCancel(slotId: string) {
    setLoadingSlot(slotId);
    await fetch(`/api/tabling/${event.id}/signup`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId }),
    });
    setLoadingSlot(null);
    router.refresh();
  }

  async function handlePostData(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/tabling/${event.id}/post-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentsReached: Number(postForm.studentsReached),
        ambassadorsShowed: Number(postForm.ambassadorsShowed),
        totalHours: Number(postForm.totalHours),
      }),
    });
    setPostOpen(false);
    router.refresh();
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-hla-700"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-hla-900">{event.location}</h1>
          <p className="text-gray-500 text-sm mt-1">Created by {event.createdBy.name}</p>
        </div>
        {event.postData ? (
          <Badge variant="secondary">Post-data logged</Badge>
        ) : (
          <Badge variant="tabling">Upcoming</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4 text-hla-400" />
              {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
            </div>
            {event.team && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-hla-400" />
                {event.team.name}
              </div>
            )}
            {event.snackPlan && (
              <div className="flex items-center gap-2 text-gray-600">
                <Cookie className="h-4 w-4 text-hla-400" />
                {event.snackPlan}
              </div>
            )}
          </CardContent>
        </Card>

        {event.postData && (
          <Card className="bg-hla-50 border-hla-200">
            <CardHeader className="pb-2"><CardTitle className="text-base">Post-Event Stats</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><span className="font-semibold">{event.postData.studentsReached}</span> students reached</p>
              <p><span className="font-semibold">{event.postData.ambassadorsShowed}</span> ambassadors showed</p>
              <p><span className="font-semibold">{event.postData.totalHours}h</span> total hours</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Time Slots */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-hla-900">Time Slots</h2>
        {event.slots.map((slot) => {
          const active = slot.signups.filter((s) => !s.cancelledAt);
          const mySignup = active.find((s) => s.user.id === userId);
          return (
            <Card key={slot.id}>
              <CardContent className="pt-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">
                    {format(new Date(slot.startTime), "h:mm a")} – {format(new Date(slot.endTime), "h:mm a")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {active.length > 0
                      ? active.map((s) => s.user.name).join(", ")
                      : "No sign-ups yet"}
                  </p>
                </div>
                {role === "AMBASSADOR" && (
                  mySignup ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(slot.id)}
                      disabled={loadingSlot === slot.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSignup(slot.id)}
                      disabled={loadingSlot === slot.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Sign Up
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Post-event data entry */}
      {canEdit && !event.postData && (
        <Dialog open={postOpen} onOpenChange={setPostOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">Log Post-Event Data</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Post-Event Data</DialogTitle></DialogHeader>
            <form onSubmit={handlePostData} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Students Reached</Label>
                <Input type="number" min={0} value={postForm.studentsReached}
                  onChange={(e) => setPostForm((p) => ({ ...p, studentsReached: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Ambassadors Showed Up</Label>
                <Input type="number" min={0} value={postForm.ambassadorsShowed}
                  onChange={(e) => setPostForm((p) => ({ ...p, ambassadorsShowed: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Total Hours Tabled</Label>
                <Input type="number" min={0} step={0.5} value={postForm.totalHours}
                  onChange={(e) => setPostForm((p) => ({ ...p, totalHours: e.target.value }))} required />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {canEdit && event.postData && (
        <Dialog open={postOpen} onOpenChange={setPostOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">Edit Post-Event Data</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Post-Event Data</DialogTitle></DialogHeader>
            <form onSubmit={handlePostData} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Students Reached</Label>
                <Input type="number" min={0} value={postForm.studentsReached}
                  onChange={(e) => setPostForm((p) => ({ ...p, studentsReached: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Ambassadors Showed Up</Label>
                <Input type="number" min={0} value={postForm.ambassadorsShowed}
                  onChange={(e) => setPostForm((p) => ({ ...p, ambassadorsShowed: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Total Hours Tabled</Label>
                <Input type="number" min={0} step={0.5} value={postForm.totalHours}
                  onChange={(e) => setPostForm((p) => ({ ...p, totalHours: e.target.value }))} required />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
