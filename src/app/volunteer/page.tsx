"use client";

import { useEffect, useState } from "react";
import { CoachLayout } from "@/components/layout/coach-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { VOLUNTEER_ROLE_TEMPLATES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { X, Users } from "lucide-react";

interface VolunteerRole {
  id: string;
  name: string;
  description: string | null;
  slotsNeeded: number;
  eventId: string;
  event: { id: string; title: string; date: string; type: string };
  signups: { id: string; family: { id: string; parentName: string } }[];
}

function VolunteerContent() {
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", slotsNeeded: "1", eventId: "" });
  const { addToast } = useToast();

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

  async function handleSubmit(e: React.FormEvent) {
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

  // Group roles by event
  const grouped = roles.reduce<Record<string, VolunteerRole[]>>((acc, role) => {
    const key = role.event.title;
    if (!acc[key]) acc[key] = [];
    acc[key].push(role);
    return acc;
  }, {});

  return (
    <CoachLayout>
      <PageHeader
        title="Volunteer Management"
        subtitle="Manage roles and view signups"
        action={{ label: "+ Add Role", onClick: () => setShowForm(true) }}
      />

      {showForm && (
        <Card className="mb-4 border-primary">
          <CardContent className="py-4">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-sm">New Volunteer Role</h3>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Select
                label="Event"
                options={events.map((e) => ({ value: e.id, label: e.title }))}
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

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-muted text-sm">No volunteer roles yet.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([eventTitle, eventRoles]) => (
            <Card key={eventTitle}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{eventTitle}</span>
                  <span className="text-xs text-muted">{formatDate(eventRoles[0].event.date)}</span>
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {eventRoles.map((role) => (
                  <div key={role.id} className="py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{role.name}</span>
                      <Badge variant={role.signups.length >= role.slotsNeeded ? "success" : "warning"}>
                        {role.signups.length}/{role.slotsNeeded}
                      </Badge>
                    </div>
                    {role.signups.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3 text-muted" />
                        <span className="text-xs text-muted">
                          {role.signups.map((s) => s.family.parentName).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CoachLayout>
  );
}

export default function VolunteerPage() {
  return <ToastProvider><VolunteerContent /></ToastProvider>;
}
