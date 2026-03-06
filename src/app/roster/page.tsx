"use client";

import { useEffect, useState } from "react";
import { CoachLayout } from "@/components/layout/coach-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { formatPhone } from "@/lib/utils";
import type { PlayerWithFamily } from "@/types";
import { Plus, X, UserCircle, Edit2 } from "lucide-react";

function RosterContent() {
  const [players, setPlayers] = useState<PlayerWithFamily[]>([]);
  const [families, setFamilies] = useState<{ id: string; parentName: string; phone: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", jerseyNumber: "", familyId: "" });
  const [familyForm, setFamilyForm] = useState({ parentName: "", phone: "", email: "" });

  // Edit state
  const [editingPlayer, setEditingPlayer] = useState<PlayerWithFamily | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "", lastName: "", jerseyNumber: "", notes: "",
    parentName: "", email: "", phone: "",
  });
  const [saving, setSaving] = useState(false);

  const { addToast } = useToast();

  async function load() {
    try {
      const [pRes, fRes] = await Promise.all([fetch("/api/players"), fetch("/api/families")]);
      setPlayers(await pRes.json());
      setFamilies(await fRes.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addFamily(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(familyForm),
    });
    if (res.ok) {
      const family = await res.json();
      setFamilies((prev) => [...prev, family]);
      setForm((prev) => ({ ...prev, familyId: family.id }));
      setShowAddFamily(false);
      setFamilyForm({ parentName: "", phone: "", email: "" });
      addToast("Family added", "success");
    } else {
      addToast("Failed to add family", "error");
    }
  }

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        jerseyNumber: form.jerseyNumber ? parseInt(form.jerseyNumber) : undefined,
      }),
    });
    if (res.ok) {
      await load();
      setShowAddPlayer(false);
      setForm({ firstName: "", lastName: "", jerseyNumber: "", familyId: "" });
      addToast("Player added", "success");
    } else {
      addToast("Failed to add player", "error");
    }
  }

  async function deletePlayer(id: string) {
    if (!confirm("Remove this player?")) return;
    await fetch(`/api/players/${id}`, { method: "DELETE" });
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    addToast("Player removed", "success");
  }

  function startEdit(player: PlayerWithFamily) {
    setEditingPlayer(player);
    setEditForm({
      firstName: player.firstName,
      lastName: player.lastName,
      jerseyNumber: player.jerseyNumber != null ? String(player.jerseyNumber) : "",
      notes: player.notes || "",
      parentName: player.family.parentName,
      email: player.family.email || "",
      phone: formatPhone(player.family.phone),
    });
    setShowAddPlayer(false);
    setShowAddFamily(false);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPlayer) return;
    setSaving(true);
    try {
      // Check if this family is shared by other players
      const othersOnFamily = players.filter(
        (p) => p.familyId === editingPlayer.familyId && p.id !== editingPlayer.id
      );

      // Update player fields
      const playerRes = await fetch(`/api/players/${editingPlayer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          jerseyNumber: editForm.jerseyNumber ? parseInt(editForm.jerseyNumber) : null,
          notes: editForm.notes || null,
        }),
      });

      let familyOk = false;
      if (othersOnFamily.length > 0) {
        // Family is shared — create a NEW family for this player
        const createRes = await fetch("/api/families", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentName: editForm.parentName,
            email: editForm.email || "",
            phone: editForm.phone,
          }),
        });
        if (createRes.ok) {
          const newFamily = await createRes.json();
          // Reassign this player to the new family
          const reassignRes = await fetch(`/api/players/${editingPlayer.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ familyId: newFamily.id }),
          });
          familyOk = reassignRes.ok;
        }
      } else {
        // Only player in this family — safe to update directly
        const familyRes = await fetch(`/api/families/${editingPlayer.familyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentName: editForm.parentName,
            email: editForm.email || "",
            phone: editForm.phone,
          }),
        });
        familyOk = familyRes.ok;
      }

      if (playerRes.ok && familyOk) {
        await load();
        setEditingPlayer(null);
        addToast("Player updated", "success");
      } else {
        addToast("Failed to save changes", "error");
      }
    } catch {
      addToast("Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CoachLayout>
      <PageHeader
        title="Roster"
        subtitle={`${players.length} players`}
        action={{ label: "+ Add Player", onClick: () => { setShowAddPlayer(true); setEditingPlayer(null); } }}
      />

      {/* Add family modal */}
      {showAddFamily && (
        <Card className="mb-4 border-primary">
          <CardContent className="py-4">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-sm">Add New Family</h3>
              <button onClick={() => setShowAddFamily(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={addFamily} className="space-y-3">
              <Input label="Parent Name" value={familyForm.parentName} onChange={(e) => setFamilyForm({ ...familyForm, parentName: e.target.value })} required />
              <Input label="Phone" type="tel" value={familyForm.phone} onChange={(e) => setFamilyForm({ ...familyForm, phone: e.target.value })} placeholder="(555) 123-4567" required />
              <Input label="Email (optional)" type="email" value={familyForm.email} onChange={(e) => setFamilyForm({ ...familyForm, email: e.target.value })} />
              <Button type="submit" size="sm">Save Family</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add player modal */}
      {showAddPlayer && !editingPlayer && (
        <Card className="mb-4 border-primary">
          <CardContent className="py-4">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-sm">Add Player</h3>
              <button onClick={() => setShowAddPlayer(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={addPlayer} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
              <Input label="Jersey #" type="number" value={form.jerseyNumber} onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })} />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Family</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-white"
                    value={form.familyId}
                    onChange={(e) => setForm({ ...form, familyId: e.target.value })}
                    required
                  >
                    <option value="">Select family...</option>
                    {families.map((f) => (
                      <option key={f.id} value={f.id}>{f.parentName}</option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddFamily(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button type="submit" size="sm">Add Player</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit player modal */}
      {editingPlayer && (
        <Card className="mb-4 border-primary">
          <CardContent className="py-4">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Edit2 className="h-4 w-4" />
                Edit: {editingPlayer.firstName} {editingPlayer.lastName}
              </h3>
              <button onClick={() => setEditingPlayer(null)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={saveEdit} className="space-y-4">
              {/* Player Info Section */}
              <div>
                <p className="text-xs font-medium text-muted mb-2 uppercase tracking-wide">Player Info</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="First Name" value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required />
                  <Input label="Last Name" value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} required />
                </div>
                <div className="mt-3">
                  <Input label="Jersey #" type="number" value={editForm.jerseyNumber}
                    onChange={(e) => setEditForm({ ...editForm, jerseyNumber: e.target.value })} />
                </div>
                <div className="mt-3">
                  <Textarea label="Notes" value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Allergies, medical info, etc." />
                </div>
              </div>

              {/* Family/Parent Info Section */}
              <div>
                <p className="text-xs font-medium text-muted mb-2 uppercase tracking-wide">Parent / Guardian Info</p>
                <div className="space-y-3">
                  <Input label="Parent Name" value={editForm.parentName}
                    onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })} required />
                  <Input label="Email" type="email" value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  <Input label="Phone" type="tel" value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" size="sm"
                  onClick={() => setEditingPlayer(null)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : players.length === 0 ? (
        <p className="text-muted text-sm">No players yet. Add your first player above.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {players.map((player) => (
            <Card key={player.id}>
              <CardContent className="flex items-center gap-2 sm:gap-3 py-3">
                <UserCircle className="h-8 w-8 sm:h-10 sm:w-10 text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="font-medium text-sm truncate">
                      {player.firstName} {player.lastName}
                    </span>
                    {player.jerseyNumber != null && (
                      <Badge className="shrink-0">#{player.jerseyNumber}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate">
                    {player.family.parentName} &middot; {formatPhone(player.family.phone)}
                  </p>
                  {player.notes && (
                    <p className="text-xs text-muted italic truncate">{player.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => startEdit(player)}
                    className="text-muted hover:text-primary p-1.5 sm:p-1"
                    title="Edit player"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deletePlayer(player.id)}
                    className="text-muted hover:text-danger p-1.5 sm:p-1"
                    title="Remove player"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CoachLayout>
  );
}

export default function RosterPage() {
  return <ToastProvider><RosterContent /></ToastProvider>;
}
