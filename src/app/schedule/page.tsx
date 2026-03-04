"use client";

import { useEffect, useState } from "react";
import { CoachLayout } from "@/components/layout/coach-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import { EVENT_TYPES } from "@/lib/constants";
import { X, MapPin, Edit2, Trash2 } from "lucide-react";

interface Event {
  id: string;
  type: string;
  title: string;
  opponent: string | null;
  date: string;
  endTime: string | null;
  locationName: string;
  locationAddress: string | null;
  notes: string | null;
  isCancelled: boolean;
}

function ScheduleContent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "PRACTICE",
    title: "",
    opponent: "",
    date: "",
    endTime: "",
    locationName: "",
    locationAddress: "",
    notes: "",
  });
  const { addToast } = useToast();

  async function load() {
    try {
      const res = await fetch("/api/events");
      setEvents(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ type: "PRACTICE", title: "", opponent: "", date: "", endTime: "", locationName: "", locationAddress: "", notes: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(event: Event) {
    setForm({
      type: event.type,
      title: event.title,
      opponent: event.opponent || "",
      date: new Date(event.date).toISOString().slice(0, 16),
      endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : "",
      locationName: event.locationName,
      locationAddress: event.locationAddress || "",
      notes: event.notes || "",
    });
    setEditingId(event.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editingId ? `/api/events/${editingId}` : "/api/events";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date: new Date(form.date).toISOString(),
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
        opponent: form.type === "GAME" ? form.opponent : undefined,
      }),
    });

    if (res.ok) {
      await load();
      resetForm();
      addToast(editingId ? "Event updated" : "Event created", "success");
    } else {
      addToast("Failed to save event", "error");
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
    addToast("Event deleted", "success");
  }

  return (
    <CoachLayout>
      <PageHeader
        title="Schedule"
        subtitle="Manage practices and games"
        action={{ label: "+ Add Event", onClick: () => setShowForm(true) }}
      />

      {showForm && (
        <Card className="mb-4 border-primary">
          <CardContent className="py-4">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-sm">{editingId ? "Edit Event" : "New Event"}</h3>
              <button onClick={resetForm}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Select
                label="Type"
                options={EVENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />
              <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Game vs Blue Jays" required />
              {form.type === "GAME" && (
                <Input label="Opponent" value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} placeholder="Team name" />
              )}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start" type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                <Input label="End" type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
              <Input label="Location" value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} placeholder="Field name" required />
              <Input label="Address (optional)" value={form.locationAddress} onChange={(e) => setForm({ ...form, locationAddress: e.target.value })} />
              <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              <div className="flex gap-2">
                <Button type="submit" size="sm">{editingId ? "Update" : "Create"}</Button>
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : events.length === 0 ? (
        <p className="text-muted text-sm">No events yet.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id} className={event.isCancelled ? "opacity-50" : ""}>
              <CardContent className="flex items-start justify-between py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{event.title}</span>
                    <Badge variant={event.type === "GAME" ? "warning" : event.type === "PRACTICE" ? "info" : "default"}>
                      {event.type}
                    </Badge>
                    {event.isCancelled && <Badge variant="danger">Cancelled</Badge>}
                  </div>
                  <p className="text-xs text-muted mt-1">{formatDateTime(event.date)}</p>
                  <p className="text-xs text-muted flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {event.locationName}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(event)} className="p-1.5 hover:bg-gray-100 rounded">
                    <Edit2 className="h-3.5 w-3.5 text-muted" />
                  </button>
                  <button onClick={() => deleteEvent(event.id)} className="p-1.5 hover:bg-gray-100 rounded">
                    <Trash2 className="h-3.5 w-3.5 text-muted" />
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

export default function SchedulePage() {
  return <ToastProvider><ScheduleContent /></ToastProvider>;
}
