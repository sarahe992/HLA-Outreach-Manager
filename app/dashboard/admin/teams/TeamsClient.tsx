"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Archive, ArchiveRestore, UserPlus, X } from "lucide-react";
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
      <Dialog open={!!addOpen} onOpenChange={(o) => { if (!o) { setAddOpen(null); setAddUserId(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Member — {addOpen?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Select Member</Label>
              <Select onValueChange={setAddUserId}>
                <SelectTrigger><SelectValue placeholder="Choose a member…" /></SelectTrigger>
                <SelectContent>
                  {allUsers
                    .filter((u) => u.id !== undefined)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                        {u.teamId && u.teamId !== addOpen?.id
                          ? ` (moving from another team)`
                          : u.teamId === addOpen?.id
                          ? ` (already on this team)`
                          : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={!addUserId || addUserId === ""}
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
                    onClick={() => { setAddOpen(team); setAddUserId(""); }}
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
