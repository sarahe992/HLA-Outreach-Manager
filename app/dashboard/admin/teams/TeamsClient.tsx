"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Pencil, Archive, UserPlus, X } from "lucide-react";
import type { Role } from "@prisma/client";

interface Member {
  id: string; name: string; email: string; role: string;
  yearInSchool?: string; major?: string;
}
interface Team {
  id: string; name: string; isArchived: boolean; users: Member[];
}
interface SimpleUser {
  id: string; name: string; role: string; teamId: string | null;
}

interface Props {
  teams: Team[];
  allUsers: SimpleUser[];
  role: Role;
}

const roleBadge: Record<string, "default" | "secondary" | "outline"> = {
  LEADERSHIP: "default",
  LEAD_AMBASSADOR: "secondary",
  AMBASSADOR: "outline",
};

const canEdit = (role: Role) => role === "LEAD_AMBASSADOR" || role === "LEADERSHIP";
const canAdmin = (role: Role) => role === "LEADERSHIP";

export default function TeamsClient({ teams, allUsers, role }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [addOpen, setAddOpen] = useState<Team | null>(null);
  const [addUserId, setAddUserId] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setCreateOpen(false);
    setNewName("");
    router.refresh();
  }

  async function updateTeam(id: string, data: Partial<{ name: string; isArchived: boolean }>) {
    await fetch(`/api/teams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditTeam(null);
    router.refresh();
  }

  async function assignUser(userId: string, teamId: string | null) {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, teamId }),
    });
    setAddOpen(null);
    setAddUserId("");
    router.refresh();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hla-900">Teams</h1>
          <p className="text-gray-500 text-sm mt-1">{teams.length} team{teams.length !== 1 ? "s" : ""}</p>
        </div>
        {canAdmin(role) && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> New Team</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Team</DialogTitle></DialogHeader>
              <form onSubmit={createTeam} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Team Name</Label>
                  <Input placeholder="Tanner Building Team" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Rename dialog */}
      <Dialog open={!!editTeam} onOpenChange={(o) => !o && setEditTeam(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Team</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateTeam(editTeam!.id, { name: editName }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>New Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add member dialog */}
      <Dialog open={!!addOpen} onOpenChange={(o) => { if (!o) { setAddOpen(null); setAddUserId(""); setMemberSearch(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Member — {addOpen?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members…"
                value={memberSearch}
                onChange={(e) => { setMemberSearch(e.target.value); setAddUserId(""); }}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
              {allUsers
                .filter((u) => u.name.toLowerCase().includes(memberSearch.toLowerCase()))
                .map((u) => {
                  const onThisTeam = u.teamId === addOpen?.id;
                  const selected = addUserId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => !onThisTeam && setAddUserId(u.id)}
                      disabled={onThisTeam}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors
                        ${selected ? "bg-hla-50 text-hla-900 font-medium" : "hover:bg-gray-50 text-gray-700"}
                        ${onThisTeam ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span>{u.name}</span>
                      <span className="text-xs text-gray-400">
                        {onThisTeam ? "Already on team" : u.teamId ? "On another team" : ""}
                      </span>
                    </button>
                  );
                })}
              {allUsers.filter((u) => u.name.toLowerCase().includes(memberSearch.toLowerCase())).length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">No members found.</p>
              )}
            </div>
            <Button
              className="w-full cursor-pointer"
              disabled={!addUserId}
              onClick={() => addUserId && assignUser(addUserId, addOpen!.id)}
            >
              Add to Team
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {teams.map((team) => (
          <div key={team.id} className="bg-white rounded-xl border border-hla-100 shadow-sm overflow-hidden">
            {/* Team header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-hla-50">
              <div className="flex items-center gap-3">
                <p className="font-semibold text-hla-900">{team.name}</p>
                <span className="text-xs text-gray-400">{team.users.length} member{team.users.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1">
                {canEdit(role) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => { setAddOpen(team); setAddUserId(""); setMemberSearch(""); }}
                  >
                    <UserPlus className="h-4 w-4 mr-1" /> Add Member
                  </Button>
                )}
                {canAdmin(role) && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditTeam(team); setEditName(team.name); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateTeam(team.id, { isArchived: true })}
                      title="Archive"
                    >
                      <Archive className="h-4 w-4 text-gray-400" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Member list */}
            {team.users.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">No members yet.</p>
            ) : (
              <div className="divide-y divide-hla-50">
                {team.users.map((member) => (
                  <div key={member.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-hla-100 flex items-center justify-center text-xs font-semibold text-hla-700">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        {(member.yearInSchool || member.major) && (
                          <p className="text-xs text-gray-400">
                            {[member.yearInSchool, member.major].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={roleBadge[member.role] ?? "outline"}>
                        {member.role.replace("_", " ")}
                      </Badge>
                      {canEdit(role) && (
                        <button
                          onClick={() => assignUser(member.id, null)}
                          className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                          title="Remove from team"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
