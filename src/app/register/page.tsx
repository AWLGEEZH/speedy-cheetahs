"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Save,
  Users,
  Lock,
  Phone,
  ArrowLeft,
} from "lucide-react";

interface RosterPlayer {
  id: string;
  firstName: string;
  jerseyNumber: number | null;
}

interface RosterFamily {
  id: string;
  players: RosterPlayer[];
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
}

interface FullFamily {
  id: string;
  parentName: string;
  email: string | null;
  phone: string;
  smsOptIn: boolean;
  emailOptIn: boolean;
  players: { id: string; firstName: string; lastName: string; jerseyNumber: number | null }[];
  contacts: Contact[];
}

type Screen = "code" | "roster" | "verify" | "edit";

function RegisterContent() {
  const [screen, setScreen] = useState<Screen>("code");
  const [loading, setLoading] = useState(true);
  const [hasCode, setHasCode] = useState(false);
  const { addToast } = useToast();

  // Screen 1: Code gate
  const [codeInput, setCodeInput] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Screen 2: Roster
  const [rosterFamilies, setRosterFamilies] = useState<RosterFamily[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState("");

  // Screen 3: Phone verification
  const [phoneInput, setPhoneInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [sendingPin, setSendingPin] = useState(false);
  const [pinSent, setPinSent] = useState(false);
  const [confirmingPin, setConfirmingPin] = useState(false);
  const [familyToken, setFamilyToken] = useState<string | null>(null);

  // Screen 4: Edit family
  const [family, setFamily] = useState<FullFamily | null>(null);
  const [editForm, setEditForm] = useState({
    parentName: "",
    email: "",
    phone: "",
    smsOptIn: true,
    emailOptIn: false,
  });
  const [saving, setSaving] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    relationship: "",
  });
  const [addingContact, setAddingContact] = useState(false);

  // Check if code is needed on mount
  useEffect(() => {
    async function init() {
      try {
        // Check if we already have a valid session
        const storedCode = sessionStorage.getItem("3dp-reg-code");
        const storedToken = sessionStorage.getItem("3dp-family-token");
        const storedFamilyId = sessionStorage.getItem("3dp-family-id");

        const res = await fetch("/api/team");
        if (res.ok) {
          const team = await res.json();
          const needsCode = team.hasRegistrationCode === true;
          setHasCode(needsCode);

          if (!needsCode || storedCode === "verified") {
            // Load roster directly
            await loadRoster();
            setScreen("roster");

            // If we have a valid token, try to restore edit session
            if (storedToken && storedFamilyId) {
              setFamilyToken(storedToken);
              setSelectedFamilyId(storedFamilyId);
            }
          }
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRoster() {
    const res = await fetch("/api/team/roster");
    if (res.ok) {
      const data = await res.json();
      setRosterFamilies(data);
    }
  }

  // Screen 1: Verify invite code
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setVerifyingCode(true);
    try {
      const res = await fetch("/api/team/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput.trim() }),
      });
      if (res.ok) {
        sessionStorage.setItem("3dp-reg-code", "verified");
        await loadRoster();
        setScreen("roster");
      } else {
        addToast("Invalid team code. Please try again.", "error");
      }
    } catch {
      addToast("Failed to verify code", "error");
    } finally {
      setVerifyingCode(false);
    }
  }

  // Screen 2: Select player
  function handleSelectPlayer(familyId: string, playerName: string) {
    setSelectedFamilyId(familyId);
    setSelectedPlayerName(playerName);
    setPhoneInput("");
    setPinInput("");
    setPinSent(false);

    // If we already have a token for this family, go straight to edit
    const storedToken = sessionStorage.getItem("3dp-family-token");
    const storedFamilyId = sessionStorage.getItem("3dp-family-id");
    if (storedToken && storedFamilyId === familyId) {
      setFamilyToken(storedToken);
      loadFamilyData(familyId, storedToken);
      return;
    }

    setScreen("verify");
  }

  // Screen 3: Send phone verification PIN
  async function handleSendPin(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneInput.trim() || !selectedFamilyId) return;
    setSendingPin(true);
    try {
      const res = await fetch("/api/team/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneInput.trim(),
          familyId: selectedFamilyId,
        }),
      });
      if (res.ok) {
        setPinSent(true);
        addToast("Verification code sent! Check your phone.", "success");
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to send code", "error");
      }
    } catch {
      addToast("Failed to send verification code", "error");
    } finally {
      setSendingPin(false);
    }
  }

  // Screen 3: Confirm PIN
  async function handleConfirmPin(e: React.FormEvent) {
    e.preventDefault();
    if (!pinInput.trim() || !selectedFamilyId) return;
    setConfirmingPin(true);
    try {
      const res = await fetch("/api/team/confirm-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneInput.trim(),
          pin: pinInput.trim(),
          familyId: selectedFamilyId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFamilyToken(data.token);
        sessionStorage.setItem("3dp-family-token", data.token);
        sessionStorage.setItem("3dp-family-id", selectedFamilyId);
        await loadFamilyData(selectedFamilyId, data.token);
      } else {
        const data = await res.json();
        addToast(data.error || "Invalid code", "error");
      }
    } catch {
      addToast("Failed to verify code", "error");
    } finally {
      setConfirmingPin(false);
    }
  }

  // Load full family data with token
  async function loadFamilyData(familyId: string, token: string) {
    try {
      const res = await fetch(`/api/team/family/${familyId}`, {
        headers: { "x-family-token": token },
      });
      if (res.ok) {
        const data = await res.json();
        setFamily(data);
        setEditForm({
          parentName: data.parentName,
          email: data.email || "",
          phone: data.phone,
          smsOptIn: data.smsOptIn,
          emailOptIn: data.emailOptIn,
        });
        setScreen("edit");
      } else if (res.status === 401) {
        // Token expired
        sessionStorage.removeItem("3dp-family-token");
        sessionStorage.removeItem("3dp-family-id");
        setFamilyToken(null);
        setScreen("verify");
        addToast("Session expired. Please verify your phone again.", "error");
      }
    } catch {
      addToast("Failed to load family data", "error");
    }
  }

  // Screen 4: Save family edits
  async function handleSave() {
    if (!family || !familyToken) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/team/family/${family.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-family-token": familyToken,
        },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setFamily(updated);
        addToast("Contact info updated!", "success");
      } else if (res.status === 401) {
        sessionStorage.removeItem("3dp-family-token");
        sessionStorage.removeItem("3dp-family-id");
        setFamilyToken(null);
        setScreen("verify");
        addToast("Session expired. Please verify your phone again.", "error");
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

  // Screen 4: Add contact
  async function handleAddContact() {
    if (!family || !familyToken || !newContact.name.trim()) {
      addToast("Contact name is required", "error");
      return;
    }
    setAddingContact(true);
    try {
      const res = await fetch(`/api/team/family/${family.id}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-family-token": familyToken,
        },
        body: JSON.stringify(newContact),
      });
      if (res.ok) {
        const contact = await res.json();
        setFamily((prev) =>
          prev ? { ...prev, contacts: [...prev.contacts, contact] } : prev
        );
        setNewContact({ name: "", email: "", phone: "", relationship: "" });
        setShowAddContact(false);
        addToast("Contact added!", "success");
      } else if (res.status === 401) {
        sessionStorage.removeItem("3dp-family-token");
        sessionStorage.removeItem("3dp-family-id");
        setFamilyToken(null);
        setScreen("verify");
        addToast("Session expired. Please verify your phone again.", "error");
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

  // Screen 4: Delete contact
  async function handleDeleteContact(contactId: string) {
    if (!family || !familyToken || !window.confirm("Remove this contact?")) return;
    try {
      const res = await fetch(
        `/api/team/family/${family.id}/contacts/${contactId}`,
        {
          method: "DELETE",
          headers: { "x-family-token": familyToken },
        }
      );
      if (res.ok) {
        setFamily((prev) =>
          prev
            ? { ...prev, contacts: prev.contacts.filter((c) => c.id !== contactId) }
            : prev
        );
        addToast("Contact removed", "success");
      } else if (res.status === 401) {
        sessionStorage.removeItem("3dp-family-token");
        sessionStorage.removeItem("3dp-family-id");
        setFamilyToken(null);
        setScreen("verify");
        addToast("Session expired. Please verify your phone again.", "error");
      } else {
        addToast("Failed to remove contact", "error");
      }
    } catch {
      addToast("Failed to remove contact", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // ─── SCREEN 1: CODE GATE ──────────────────────────────
  if (screen === "code") {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Lock className="h-12 w-12 mx-auto mb-4 text-primary opacity-60" />
          <h1 className="text-xl font-bold text-secondary">Parent Registration</h1>
          <p className="text-sm text-muted mt-2">
            Enter the team code provided by your coach to access registration.
          </p>
        </div>
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <Input
            label="Team Code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Enter team code"
            required
          />
          <Button type="submit" className="w-full" disabled={verifyingCode}>
            {verifyingCode ? "Verifying..." : "Continue"}
          </Button>
        </form>
      </div>
    );
  }

  // ─── SCREEN 2: ROSTER (stripped) ──────────────────────
  if (screen === "roster") {
    const allPlayers = rosterFamilies
      .flatMap((f) =>
        f.players.map((p) => ({ ...p, familyId: f.id }))
      )
      .sort((a, b) => a.firstName.localeCompare(b.firstName));

    const midpoint = Math.ceil(allPlayers.length / 2);
    const leftColumn = allPlayers.slice(0, midpoint);
    const rightColumn = allPlayers.slice(midpoint);

    function renderPlayerButton(player: RosterPlayer & { familyId: string }) {
      return (
        <button
          key={player.id}
          onClick={() => handleSelectPlayer(player.familyId, player.firstName)}
          className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/40 bg-card transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {player.jerseyNumber ?? "—"}
            </div>
            <p className="font-medium text-sm">{player.firstName}</p>
          </div>
        </button>
      );
    }

    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-secondary">Parent Registration</h1>
          <p className="text-sm text-muted">
            Select your child to update contact information
          </p>
        </div>

        {allPlayers.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No players on the roster yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <div className="space-y-2">
              {leftColumn.map((p) => renderPlayerButton(p))}
            </div>
            <div className="space-y-2">
              {rightColumn.map((p) => renderPlayerButton(p))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── SCREEN 3: PHONE VERIFICATION ─────────────────────
  if (screen === "verify") {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <button
          onClick={() => {
            setScreen("roster");
            setPinSent(false);
            setPinInput("");
          }}
          className="flex items-center gap-1 text-sm text-muted hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to roster
        </button>

        <div className="text-center mb-8">
          <Phone className="h-12 w-12 mx-auto mb-4 text-primary opacity-60" />
          <h1 className="text-xl font-bold text-secondary">Verify Your Phone</h1>
          <p className="text-sm text-muted mt-2">
            Enter the phone number you registered with to verify your identity
            {selectedPlayerName && (
              <> for <strong>{selectedPlayerName}</strong></>
            )}.
          </p>
        </div>

        {!pinSent ? (
          <form onSubmit={handleSendPin} className="space-y-4">
            <Input
              label="Phone Number"
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="(555) 123-4567"
              required
            />
            <Button type="submit" className="w-full" disabled={sendingPin}>
              {sendingPin ? "Sending..." : "Send Verification Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleConfirmPin} className="space-y-4">
            <p className="text-sm text-muted text-center">
              A 6-digit code was sent to your phone. Enter it below.
            </p>
            <Input
              label="Verification Code"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
            />
            <Button type="submit" className="w-full" disabled={confirmingPin}>
              {confirmingPin ? "Verifying..." : "Verify"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setPinSent(false);
                setPinInput("");
              }}
              className="w-full text-center text-sm text-muted hover:text-primary"
            >
              Didn&apos;t receive a code? Try again
            </button>
          </form>
        )}
      </div>
    );
  }

  // ─── SCREEN 4: EDIT FAMILY ────────────────────────────
  if (screen === "edit" && family) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button
          onClick={() => {
            setScreen("roster");
            setFamily(null);
            setShowAddContact(false);
          }}
          className="flex items-center gap-1 text-sm text-muted hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to roster
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-secondary">
            {family.players.map((p) => p.firstName).join(" & ")}&apos;s Family
          </h1>
          <p className="text-sm text-muted">
            Update your contact information below
          </p>
        </div>

        <div className="space-y-4">
          {/* Primary Contact */}
          <div className="border border-border rounded-lg bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold">Primary Contact</h3>
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
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>

          {/* Additional Contacts */}
          <div className="border border-border rounded-lg bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Additional Contacts</h3>
              {!showAddContact && (
                <Button size="sm" variant="outline" onClick={() => setShowAddContact(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              )}
            </div>

            {family.contacts.length === 0 && !showAddContact && (
              <p className="text-xs text-muted py-2">
                No additional contacts yet. Add a second parent, grandparent, or emergency contact.
              </p>
            )}

            {family.contacts.map((contact) => (
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
                <Button size="sm" variant="danger" onClick={() => handleDeleteContact(contact.id)}>
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
                  <Button size="sm" onClick={handleAddContact} disabled={addingContact}>
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
      </div>
    );
  }

  return null;
}

export default function RegisterPage() {
  return (
    <ToastProvider>
      <RegisterContent />
    </ToastProvider>
  );
}
