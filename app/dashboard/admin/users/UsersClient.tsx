"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckSquare, Copy, Link2, UserPlus } from "lucide-react";
import type { Role } from "@prisma/client";

interface User {
  id: string; name: string; email: string; role: string;
  teamId?: string; team?: { name: string };
  yearInSchool?: string; major?: string; accountClaimed: boolean;
}
interface Team { id: string; name: string }
interface Invite { id: string; token: string; role: string; expiresAt: string }

interface Props {
  users: User[];
  teams: Team[];
  invites: Invite[];
  role: Role;
  currentUserId: string;
}

const roleBadge: Record<string, "default" | "secondary" | "outline"> = {
  LEADERSHIP: "default",
  LEAD_AMBASSADOR: "secondary",
  AMBASSADOR: "outline",
};

export default function UsersClient({ users, teams, invites: initialInvites, role, currentUserId }: Props) {
  const router = useRouter();
  const [invites, setInvites] = useState(initialInvites);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState<User | null>(null);
  const [assignTeamId, setAssignTeamId] = useState("");
  const [copied, setCopied] = useState(false);
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
    if (!confirm(`Delete ${selected.size} user${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [...selected] }),
    });
    exitSelectMode();
    setDeleting(false);
    router.refresh();
  }

  async function generateInvite(inviteRole: string) {
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: inviteRole }),
    });
    const data = await res.json();
    setNewInviteUrl(data.url);
    setInvites((prev) => [...prev, { id: data.token, token: data.token, role: inviteRole, expiresAt: "" }]);
  }

  function copyUrl() {
    if (!newInviteUrl) return;
    navigator.clipboard.writeText(newInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function assignTeam() {
    if (!assignOpen) return;
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: assignOpen.id, teamId: assignTeamId === "__none__" ? "" : assignTeamId }),
    });
    setAssignOpen(null);
    router.refresh();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hla-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} member{users.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {role === "LEADERSHIP" && selectMode && (
            <>
              {selected.size > 0 && (
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={deleting}>
                  {deleting ? "Deleting…" : `Delete (${selected.size})`}
                </Button>
              )}
              <Button variant="outline" onClick={exitSelectMode}>Cancel</Button>
            </>
          )}
          {role === "LEADERSHIP" && !selectMode && (
            <Button variant="outline" onClick={() => setSelectMode(true)}>
              <CheckSquare className="h-4 w-4 mr-1" /> Select
            </Button>
          )}
          {role === "LEADERSHIP" && (
            <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) setNewInviteUrl(null); }}>
              <DialogTrigger asChild>
                <Button><UserPlus className="h-4 w-4 mr-1" /> Generate Invite</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Generate Invite Link</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  {!newInviteUrl ? (
                    <>
                      <p className="text-sm text-gray-600">Choose the role for the new invite link:</p>
                      <div className="flex gap-2">
                        <Button onClick={() => generateInvite("LEAD_AMBASSADOR")} variant="secondary" className="flex-1">
                          Lead Ambassador
                        </Button>
                        <Button onClick={() => generateInvite("LEADERSHIP")} className="flex-1">
                          Club Leadership
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-green-600 font-medium">Invite link created! Valid for 7 days.</p>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border text-xs font-mono break-all">
                        <Link2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        {newInviteUrl}
                      </div>
                      <Button onClick={copyUrl} variant="outline" className="w-full">
                        <Copy className="h-4 w-4 mr-1" />
                        {copied ? "Copied!" : "Copy Link"}
                      </Button>
                    </div>
                  )}
                  {initialInvites.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-gray-500 mb-2">Active Invites</p>
                      <div className="space-y-1">
                        {initialInvites.map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between text-xs">
                            <span className="font-mono text-gray-500">{inv.token.slice(0, 16)}…</span>
                            <Badge variant="outline">{inv.role.replace("_", " ")}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Assign team dialog */}
      <Dialog open={!!assignOpen} onOpenChange={(o) => !o && setAssignOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Team — {assignOpen?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Select defaultValue={assignOpen?.teamId ?? "__none__"} onValueChange={setAssignTeamId}>
                <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No team</SelectItem>
                  {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={assignTeam} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl border border-hla-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-hla-50">
            <tr>
              {selectMode && <th className="w-10 px-4 py-3" />}
              {["Name", "Email", "Role", "Team", "Major", "Year", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-hla-800 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className={`border-t border-hla-50 hover:bg-hla-50/50 ${selectMode && selected.has(u.id) ? "bg-hla-50" : ""}`}
              >
                {selectMode && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      disabled={u.id === currentUserId}
                      className="h-4 w-4 cursor-pointer disabled:opacity-30"
                    />
                  </td>
                )}
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    {u.name}
                    {!u.accountClaimed && (
                      <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-normal">
                        Unclaimed
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={roleBadge[u.role] ?? "outline"}>
                    {u.role.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.team?.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{u.major ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{u.yearInSchool ?? "—"}</td>
                <td className="px-4 py-3">
                  {!selectMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setAssignOpen(u); setAssignTeamId(u.teamId ?? "__none__"); }}
                    >
                      Assign Team
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
