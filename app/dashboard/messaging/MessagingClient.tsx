"use client";
import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Megaphone, MessageSquare, Users } from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ThreadMember { user: { id: string; name: string } }
interface Thread {
  id: string; type: string; team?: { name: string };
  members: ThreadMember[];
  messages: { body: string; sender: { name: string }; createdAt: string }[];
}
interface Announcement { id: string; subject: string; body: string; sender: { name: string }; createdAt: string }
interface User { id: string; name: string; role: string }
interface Team { id: string; name: string }
interface Message { id: string; body: string; senderId: string; sender: { id: string; name: string }; createdAt: string }

interface Props {
  threads: Thread[];
  announcements: Announcement[];
  users: User[];
  teams: Team[];
  currentUserId: string;
  role: Role;
  teamId: string | null;
}

export default function MessagingClient({ threads, announcements, users, teams, currentUserId, role }: Props) {
  const [activeTab, setActiveTab] = useState<"chat" | "announcements">("chat");
  const [activeThread, setActiveThread] = useState<string | null>(threads[0]?.id ?? null);
  const [newMsg, setNewMsg] = useState("");
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [dmOpen, setDmOpen] = useState(false);
  const [aForm, setAForm] = useState({ subject: "", body: "", targetType: "team", targetIds: [] as string[] });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, mutate } = useSWR<Message[]>(
    activeThread ? `/api/messages/${activeThread}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !activeThread) return;
    await fetch(`/api/messages/${activeThread}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newMsg.trim() }),
    });
    setNewMsg("");
    mutate();
  }

  async function startDM(userId: string) {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "DIRECT", recipientId: userId }),
    });
    const thread = await res.json();
    setActiveThread(thread.id);
    setDmOpen(false);
  }

  async function sendAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aForm),
    });
    setAnnouncementOpen(false);
    setAForm({ subject: "", body: "", targetType: "team", targetIds: [] });
  }

  function threadName(t: Thread) {
    if (t.type === "GROUP") return t.team?.name ?? "Group Chat";
    const other = t.members.find((m) => m.user.id !== currentUserId);
    return other?.user.name ?? "Direct Message";
  }

  const canSendAnnouncement = ["LEADERSHIP", "LEAD_AMBASSADOR"].includes(role);
  const canStartDM = ["LEADERSHIP", "LEAD_AMBASSADOR"].includes(role);

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Left panel */}
      <div className="w-72 border-r border-hla-100 flex flex-col bg-white">
        <div className="p-4 border-b border-hla-100">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("chat")}
              className={cn("flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors", activeTab === "chat" ? "bg-hla-700 text-white" : "text-gray-600 hover:bg-hla-50")}
            >
              <MessageSquare className="h-4 w-4 inline mr-1" /> Chat
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={cn("flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors", activeTab === "announcements" ? "bg-hla-700 text-white" : "text-gray-600 hover:bg-hla-50")}
            >
              <Megaphone className="h-4 w-4 inline mr-1" /> Announce
            </button>
          </div>
        </div>

        {activeTab === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto divide-y divide-hla-50">
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveThread(t.id)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-hla-50 transition-colors",
                    activeThread === t.id && "bg-hla-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-hla-200 flex items-center justify-center text-xs font-bold text-hla-800">
                      {t.type === "GROUP" ? <Users className="h-4 w-4" /> : threadName(t).charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{threadName(t)}</p>
                      {t.messages[0] && (
                        <p className="text-xs text-gray-400 truncate">
                          {t.messages[0].sender.name}: {t.messages[0].body}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-hla-100 space-y-2">
              {canStartDM && (
                <Dialog open={dmOpen} onOpenChange={setDmOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">+ New Message</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Start a Direct Message</DialogTitle></DialogHeader>
                    <div className="space-y-2">
                      {users.filter((u) => u.id !== currentUserId).map((u) => (
                        <button key={u.id} onClick={() => startDM(u.id)}
                          className="w-full text-left p-3 rounded-lg border border-hla-100 hover:bg-hla-50 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-hla-200 flex items-center justify-center text-xs font-bold text-hla-800">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{u.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{u.role.replace("_", " ").toLowerCase()}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </>
        )}

        {activeTab === "announcements" && (
          <div className="flex-1 overflow-y-auto divide-y divide-hla-50">
            {canSendAnnouncement && (
              <div className="p-3">
                <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full"><Megaphone className="h-4 w-4 mr-1" /> New Announcement</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Send Announcement</DialogTitle></DialogHeader>
                    <form onSubmit={sendAnnouncement} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>Subject</Label>
                        <Input value={aForm.subject} onChange={(e) => setAForm((p) => ({ ...p, subject: e.target.value }))} required />
                      </div>
                      {role === "LEADERSHIP" && (
                        <div className="space-y-1.5">
                          <Label>Send To</Label>
                          <Select onValueChange={(v) => setAForm((p) => ({ ...p, targetType: v, targetIds: [] }))}>
                            <SelectTrigger><SelectValue placeholder="Everyone" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Everyone</SelectItem>
                              {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label>Message</Label>
                        <Textarea rows={4} value={aForm.body} onChange={(e) => setAForm((p) => ({ ...p, body: e.target.value }))} required />
                      </div>
                      <Button type="submit" className="w-full">Send</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {announcements.map((a) => (
              <div key={a.id} className="p-3 space-y-1">
                <p className="text-sm font-semibold text-hla-900">{a.subject}</p>
                <p className="text-xs text-gray-500">From {a.sender.name} · {format(new Date(a.createdAt), "MMM d")}</p>
                <p className="text-sm text-gray-700 mt-1 line-clamp-3">{a.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      {activeTab === "chat" && activeThread ? (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages?.map((msg) => {
              const mine = msg.sender.id === currentUserId;
              return (
                <div key={msg.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-sm rounded-2xl px-4 py-2.5 text-sm", mine ? "bg-hla-700 text-white" : "bg-white border border-hla-100 text-gray-800")}>
                    {!mine && <p className="text-xs font-semibold text-hla-600 mb-1">{msg.sender.name}</p>}
                    <p>{msg.body}</p>
                    <p className={cn("text-xs mt-1", mine ? "text-hla-200" : "text-gray-400")}>
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="p-4 border-t border-hla-100 bg-white flex gap-2">
            <Input
              placeholder="Type a message…"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMsg.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          {activeTab === "chat" ? "Select a conversation to start chatting" : ""}
        </div>
      )}
    </div>
  );
}
