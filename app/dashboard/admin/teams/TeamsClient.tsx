"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Archive, ArchiveRestore } from "lucide-react";

interface Team { id: string; name: string; isArchived: boolean }

export default function TeamsClient({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [newName, setNewName] = useState("");
  const [editName, setEditName] = useState("");

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hla-900">Teams</h1>
          <p className="text-gray-500 text-sm mt-1">Create, rename, or archive teams</p>
        </div>
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
      </div>

      {/* Edit dialog */}
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

      <div className="space-y-3">
        {teams.map((team) => (
          <Card key={team.id} className={team.isArchived ? "opacity-60" : ""}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="font-semibold text-hla-900">{team.name}</p>
                {team.isArchived && <Badge variant="outline">Archived</Badge>}
              </div>
              <div className="flex items-center gap-2">
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
                  onClick={() => updateTeam(team.id, { isArchived: !team.isArchived })}
                  title={team.isArchived ? "Restore" : "Archive"}
                >
                  {team.isArchived
                    ? <ArchiveRestore className="h-4 w-4 text-hla-600" />
                    : <Archive className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
