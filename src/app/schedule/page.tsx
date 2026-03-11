"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SkeletonEventRow } from "@/components/ui/skeleton";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { formatDateTimeRange } from "@/lib/utils";
import { EVENT_TYPES } from "@/lib/constants";
import Link from "next/link";
import { X, MapPin, Edit2, Trash2, Users } from "lucide-react";

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
  _count?: { attendanceRsvps: number };
}

function ScheduleContent() {
  const { isCoach } = useAuth();
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
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-secondary">Schedule</h1>
          <p className="text-sm text-muted">
            {isCoach ? "Manage practices and games" : "Upcoming practices and games"}
          </p>
        </div>
        {isCoach && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Add Event
          </Button>
        )}
      </div>

      {isCoach && showForm && (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <div className="space-y-3 animate-fade-in">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonEventRow key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-muted text-sm text-center py-8">No upcoming events scheduled.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className={`bg-surface border border-border rounded-lg p-4 ${
                event.isCancelled ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        event.type === "GAME" ? "bg-primary" : "bg-blue-500"
                      }`}
                    />
                    <span className="font-medium text-sm">{event.title}</span>
                    <Badge variant={event.type === "GAME" ? "warning" : event.type === "PRACTICE" ? "info" : "default"}>
                      {event.type}
                    </Badge>
                    {event.isCancelled && <Badge variant="danger">Cancelled</Badge>}
                  </div>
                  <p className="text-sm text-muted">{formatDateTimeRange(event.date, event.endTime)}</p>
                  <p className="text-sm text-muted flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {event.locationName}
                    {event.locationAddress && ` - ${event.locationAddress}`}
                  </p>
                  {event.notes && (
                    <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                      {event.notes}
                    </p>
                  )}
                  {event.type === "GAME" && !event.isCancelled && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="success">
                        <Users className="h-3 w-3 mr-1 inline" />
                        {event._count?.attendanceRsvps ?? 0} confirmed
                      </Badge>
                      <Link href={`/rsvp/${event.id}`}>
                        <Button size="sm" variant="outline">RSVP</Button>
                      </Link>
                    </div>
                  )}
                </div>
                {isCoach && (
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => startEdit(event)} className="p-1.5 hover:bg-gray-100 rounded">
                      <Edit2 className="h-3.5 w-3.5 text-muted" />
                    </button>
                    <button onClick={() => deleteEvent(event.id)} className="p-1.5 hover:bg-gray-100 rounded">
                      <Trash2 className="h-3.5 w-3.5 text-muted" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SchedulePage() {
  return <ToastProvider><ScheduleContent /></ToastProvider>;
}
