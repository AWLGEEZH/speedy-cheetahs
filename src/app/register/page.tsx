"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { ChevronDown, ChevronUp, Plus, Trash2, Save, Users } from "lucide-react";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
}

interface Family {
  id: string;
  parentName: string;
  email: string | null;
  phone: string;
  smsOptIn: boolean;
  emailOptIn: boolean;
  players: Player[];
  contacts: Contact[];
}

type PlayerWithFamily = Player & { family: Family };

function RegisterContent() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const { addToast } = useToast();

  // Primary contact edit form
  const [editForm, setEditForm] = useState({
    parentName: "",
    email: "",
    phone: "",
    smsOptIn: true,
    emailOptIn: false,
  });
  const [saving, setSaving] = useState(false);

  // Add contact form
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    relationship: "",
  });
  const [addingContact, setAddingContact] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/team/roster");
        if (res.ok) {
          const data = await res.json();
          setFamilies(data);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    }
    load();
  }, []);

  function expandFamily(family: Family) {
    if (expandedFamily === family.id) {
      setExpandedFamily(null);
      setShowAddContact(false);
      return;
    }
    setExpandedFamily(family.id);
    setEditForm({
      parentName: family.parentName,
      email: family.email || "",
      phone: family.phone,
      smsOptIn: family.smsOptIn,
      emailOptIn: family.emailOptIn,
    });
    setShowAddContact(false);
    setNewContact({ name: "", email: "", phone: "", relationship: "" });
  }

  async function handleSave(familyId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/team/family/${familyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setFamilies((prev) =>
          prev.map((f) => (f.id === familyId ? updated : f))
        );
        addToast("Contact info updated!", "success");
      } else {
        const data = await res.json();
        addToast(data.error?.fieldErrors ? "Please check your entries" : (data.error || "Failed to save"), "error");
      }
    } catch {
      addToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddContact(familyId: string) {
    if (!newContact.name.trim()) {
      addToast("Contact name is required", "error");
      return;
    }
    setAddingContact(true);
    try {
      const res = await fetch(`/api/team/family/${familyId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });
      if (res.ok) {
        const contact = await res.json();
        setFamilies((prev) =>
          prev.map((f) =>
            f.id === familyId
              ? { ...f, contacts: [...f.contacts, contact] }
              : f
          )
        );
        setNewContact({ name: "", email: "", phone: "", relationship: "" });
        setShowAddContact(false);
        addToast("Contact added!", "success");
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to add contact", "error");
      }
    } catch {
      addToast("Failed to add contact", "error");
    } finally {
      setAddingContact(false);
    }
  }

  async function handleDeleteContact(familyId: string, contactId: string) {
    if (!window.confirm("Remove this contact?")) return;
    try {
      const res = await fetch(
        `/api/team/family/${familyId}/contacts/${contactId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setFamilies((prev) =>
          prev.map((f) =>
            f.id === familyId
              ? { ...f, contacts: f.contacts.filter((c) => c.id !== contactId) }
              : f
          )
        );
        addToast("Contact removed", "success");
      } else {
        addToast("Failed to remove contact", "error");
      }
    } catch {
      addToast("Failed to remove contact", "error");
    }
  }

  // Build alphabetical player list with family references
  const playerList: PlayerWithFamily[] = families
    .flatMap((family) =>
      family.players.map((player) => ({
        ...player,
        family,
      }))
    )
    .sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`
      )
    );

  function renderPlayer(player: PlayerWithFamily, column: PlayerWithFamily[]) {
    const isExpanded = expandedFamily === player.family.id;
    const isFirstSiblingInColumn =
      column.findIndex((p) => p.family.id === player.family.id) ===
      column.indexOf(player);

    return (
      <div key={player.id}>
        <button
          onClick={() => expandFamily(player.family)}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${
            isExpanded
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 bg-card"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {player.jerseyNumber ?? "—"}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {player.firstName} {player.lastName}
                </p>
                <p className="text-xs text-muted truncate">
                  {player.family.parentName}
                </p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted" />
            )}
          </div>
        </button>

        {isExpanded && isFirstSiblingInColumn && (
          <div className="mt-1 border border-border rounded-lg bg-card p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Primary Contact</h3>
              <div className="space-y-3">
                <Input
                  label="Parent/Guardian Name"
                  value={editForm.parentName}
                  onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="parent@email.com"
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted">Notification Preferences</p>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.smsOptIn}
                      onChange={(e) => setEditForm({ ...editForm, smsOptIn: e.target.checked })}
                      className="rounded border-border"
                    />
                    Receive SMS notifications
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.emailOptIn}
                      onChange={(e) => setEditForm({ ...editForm, emailOptIn: e.target.checked })}
                      className="rounded border-border"
                    />
                    Receive email notifications
                  </label>
                </div>
                <Button size="sm" onClick={() => handleSave(player.family.id)} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Additional Contacts</h3>
                {!showAddContact && (
                  <Button size="sm" variant="outline" onClick={() => setShowAddContact(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                )}
              </div>

              {player.family.contacts.length === 0 && !showAddContact && (
                <p className="text-xs text-muted py-2">
                  No additional contacts yet. Add a second parent, grandparent, or emergency contact.
                </p>
              )}

              {player.family.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-start justify-between gap-2 py-2 border-b border-border last:border-0"
                >
                  <div className="text-sm min-w-0">
                    <p className="font-medium">{contact.name}</p>
                    {contact.relationship && <p className="text-xs text-muted">{contact.relationship}</p>}
                    {contact.phone && <p className="text-xs text-muted">{contact.phone}</p>}
                    {contact.email && <p className="text-xs text-muted">{contact.email}</p>}
                  </div>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteContact(player.family.id, contact.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {showAddContact && (
                <div className="border border-border rounded-lg p-3 mt-2 space-y-3">
                  <h4 className="text-xs font-semibold">New Contact</h4>
                  <Input
                    label="Name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Phone"
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted block mb-1">Relationship</label>
                    <select
                      className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card"
                      value={newContact.relationship}
                      onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="Parent">Parent</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Emergency Contact">Emergency Contact</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAddContact(player.family.id)} disabled={addingContact}>
                      {addingContact ? "Adding..." : "Add Contact"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddContact(false);
                        setNewContact({ name: "", email: "", phone: "", relationship: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const midpoint = Math.ceil(playerList.length / 2);
  const leftColumn = playerList.slice(0, midpoint);
  const rightColumn = playerList.slice(midpoint);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-secondary">Parent Registration</h1>
        <p className="text-sm text-muted">
          Find your child and update your contact information
        </p>
      </div>

      {playerList.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No players on the roster yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          <div className="space-y-2">
            {leftColumn.map((player) => renderPlayer(player, leftColumn))}
          </div>
          <div className="space-y-2">
            {rightColumn.map((player) => renderPlayer(player, rightColumn))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <ToastProvider>
      <RegisterContent />
    </ToastProvider>
  );
}
