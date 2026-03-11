"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { VOLUNTEER_ROLE_TEMPLATES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { X, Users, HandHelping, UserPlus, Trash2 } from "lucide-react";

interface VolunteerRole {
  id: string;
  name: string;
  description: string | null;
  slotsNeeded: number;
  eventId: string;
  event: { id: string; title: string; date: string; type: string };
  signups: { id: string; family: { id: string; parentName: string } }[];
}

interface EventInfo {
  id: string;
  title: string;
  date: string;
  type: string;
}

const STORAGE_KEY = "speedy-cheetahs-volunteer";

/**
 * Build a map of event ID → numbered label like "Practice 1", "Preseason Game 2", "Game 3".
 * Events must be sorted by date (ascending) before calling.
 */
function buildEventLabels(events: EventInfo[]): Map<string, string> {
  const labels = new Map<string, string>();
  let practiceNum = 0;
  let preseasonNum = 0;
  let gameNum = 0;

  // Events from the API are already sorted by date ascending
  for (const evt of events) {
    if (evt.type === "PRACTICE") {
      practiceNum++;
      labels.set(evt.id, `Practice ${practiceNum}`);
    } else if (evt.type === "GAME" && evt.title.toLowerCase().includes("preseason")) {
      preseasonNum++;
      labels.set(evt.id, `Preseason Game ${preseasonNum}`);
    } else if (evt.type === "GAME") {
      gameNum++;
      labels.set(evt.id, `Game ${gameNum}`);
    } else {
      labels.set(evt.id, evt.title);
    }
  }

  return labels;
}

function VolunteerContent() {
  const { isCoach } = useAuth();
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Coach: add role form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", slotsNeeded: "1", eventId: "" });

  // Parent: sign-up
  const [signingUp, setSigningUp] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [familyPhone, setFamilyPhone] = useState("");

  const { addToast } = useToast();

  // Build numbered labels from events list
  const eventLabels = useMemo(() => buildEventLabels(events), [events]);

  // Load saved volunteer info from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { name, phone } = JSON.parse(saved);
        if (name) setFamilyName(name);
        if (phone) setFamilyPhone(phone);
      }
    } catch { /* ignore */ }
  }, []);

  async function load() {
    try {
      const [rRes, eRes] = await Promise.all([
        fetch("/api/volunteer/roles"),
        fetch("/api/events?upcoming=true"),
      ]);
      setRoles(await rRes.json());
      const evts = await eRes.json();
      setEvents(Array.isArray(evts) ? evts : []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Coach: create role
  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/volunteer/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slotsNeeded: parseInt(form.slotsNeeded) }),
    });
    if (res.ok) {
      await load();
      setShowForm(false);
      setForm({ name: "", description: "", slotsNeeded: "1", eventId: "" });
      addToast("Role created", "success");
    } else {
      addToast("Failed to create role", "error");
    }
  }

  // Coach: delete role
  async function handleDeleteRole(roleId: string, roleName: string) {
    if (!confirm(`Delete the "${roleName}" role? Any existing signups will also be removed.`)) return;
    const res = await fetch(`/api/volunteer/roles/${roleId}`, { method: "DELETE" });
    if (res.ok) {
      await load();
      addToast("Role deleted", "success");
    } else {
      addToast("Failed to delete role", "error");
    }
  }

  // Parent: sign up for a role
  function handleTapRole(roleId: string) {
    setSigningUp(signingUp === roleId ? null : roleId);
  }

  async function handleSignup(roleId: string) {
    if (!familyName.trim()) { addToast("Please enter your name", "error"); return; }
    if (!familyPhone.trim()) { addToast("Please enter your phone number", "error"); return; }

    setSubmitting(true);
    try {
      const familyRes = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentName: familyName.trim(), phone: familyPhone.trim() }),
      });
      const family = await familyRes.json();
      if (!family.id) { addToast("Could not register. Please try again.", "error"); return; }

      const res = await fetch("/api/volunteer/signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: family.id, roleId }),
      });

      if (res.ok) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: familyName.trim(), phone: familyPhone.trim() })); } catch { /* ignore */ }
        await load();
        setSigningUp(null);
        addToast("You're signed up! Thank you!", "success");
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to sign up", "error");
      }
    } catch {
      addToast("Failed to sign up. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Group roles by event, using numbered label as the display key
  const grouped = roles.reduce<Record<string, VolunteerRole[]>>((acc, role) => {
    const label = eventLabels.get(role.eventId) || role.event.title;
    const key = `${label}|||${role.event.date}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(role);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-secondary">Volunteer</h1>
          <p className="text-sm text-muted">
            {isCoach ? "Manage roles and view signups" : "Sign up to help out at events"}
          </p>
        </div>
        {isCoach && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Add Role
          </Button>
        )}
      </div>

      {/* Coach: Add Role Form */}
      {isCoach && showForm && (
        <Card className="mb-4 border-primary">
          <CardContent className="py-4">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-sm">New Volunteer Role</h3>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreateRole} className="space-y-3">
              <Select
                label="Event"
                options={events.map((e) => ({
                  value: e.id,
                  label: `${eventLabels.get(e.id) || e.title} — ${formatDate(e.date)}`,
                }))}
                value={form.eventId}
                onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                placeholder="Select event..."
                required
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Role Name</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {VOLUNTEER_ROLE_TEMPLATES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, name: t })}
                      className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Role name" required />
              </div>
              <Input label="Slots Needed" type="number" min="1" max="10" value={form.slotsNeeded} onChange={(e) => setForm({ ...form, slotsNeeded: e.target.value })} />
              <Button type="submit" size="sm">Create Role</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Helper text for parents */}
      {!isCoach && (
        <div className="flex items-center gap-2 text-sm text-muted bg-surface border border-border rounded-lg px-4 py-3 mb-4">
          <HandHelping className="h-5 w-5 shrink-0 text-primary" />
          <span>Tap any open role below to sign up. Your info is saved for future signups.</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-muted text-sm text-center py-8">No volunteer roles available right now.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([key, eventRoles]) => {
            const [label, dateStr] = key.split("|||");
            return (
              <div key={key} className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-border">
                  <span className="font-semibold text-sm">{label}</span>
                  <span className="text-xs text-muted ml-2">{formatDate(dateStr)}</span>
                </div>
                <div className="divide-y divide-border">
                  {eventRoles.map((role) => {
                    const isFull = role.signups.length >= role.slotsNeeded;
                    const isExpanded = signingUp === role.id;

                    return (
                      <div key={role.id}>
                        {/* Role row */}
                        <div
                          className={`w-full text-left px-4 py-3 transition-colors ${
                            isFull
                              ? "opacity-70"
                              : isCoach
                                ? ""
                                : isExpanded
                                  ? "bg-primary/5"
                                  : "hover:bg-gray-50 active:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => !isFull && !isCoach && handleTapRole(role.id)}
                              disabled={isFull || isCoach}
                              className={`flex-1 min-w-0 text-left ${
                                !isFull && !isCoach ? "cursor-pointer" : "cursor-default"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{role.name}</span>
                                    {!isFull && !isExpanded && !isCoach && (
                                      <UserPlus className="h-3.5 w-3.5 text-primary" />
                                    )}
                                  </div>
                                  {role.description && (
                                    <p className="text-xs text-muted">{role.description}</p>
                                  )}
                                </div>
                                <Badge variant={isFull ? "success" : "warning"}>
                                  {role.signups.length}/{role.slotsNeeded} filled
                                </Badge>
                              </div>
                            </button>
                            {isCoach && (
                              <button
                                type="button"
                                onClick={() => handleDeleteRole(role.id, role.name)}
                                className="p-1.5 hover:bg-gray-100 rounded shrink-0"
                                title="Delete role"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted" />
                              </button>
                            )}
                          </div>
                          {role.signups.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {role.signups.map((s) => (
                                <span
                                  key={s.id}
                                  className="inline-flex items-center text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                                >
                                  {s.family.parentName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Inline sign-up form (parents only) */}
                        {isExpanded && !isCoach && (
                          <div className="px-4 pb-4 bg-primary/5 border-t border-primary/20">
                            <div className="pt-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                                  Sign up for {role.name}
                                </p>
                                <button type="button" onClick={() => setSigningUp(null)} className="text-muted hover:text-foreground p-1">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input label="Your Name" value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Parent/Guardian name" required />
                                <Input label="Phone Number" type="tel" value={familyPhone} onChange={(e) => setFamilyPhone(e.target.value)} placeholder="(555) 123-4567" required />
                              </div>
                              <Button size="sm" onClick={() => handleSignup(role.id)} disabled={submitting} className="w-full sm:w-auto">
                                {submitting ? "Signing up..." : "Sign Up"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function VolunteerPage() {
  return <ToastProvider><VolunteerContent /></ToastProvider>;
}
