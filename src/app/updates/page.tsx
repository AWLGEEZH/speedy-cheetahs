"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { formatDateTime, formatRelative, groupUpdatesByPeriod } from "@/lib/utils";
import type { UpdateWithCoach } from "@/types";
import { X, MessageSquare, Send, Mail, Pencil, Trash2, ImageIcon } from "lucide-react";

function UpdatesContent() {
  const { isCoach, coach } = useAuth();
  const [updates, setUpdates] = useState<UpdateWithCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", imageUrl: "", sendSms: false, sendEmail: false });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", message: "", imageUrl: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { addToast } = useToast();
  const groupedUpdates = useMemo(() => groupUpdatesByPeriod(updates), [updates]);

  async function load() {
    try {
      const res = await fetch("/api/updates");
      const data = await res.json();
      if (Array.isArray(data)) setUpdates(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function canEditUpdate(update: UpdateWithCoach) {
    if (!coach) return false;
    return update.coachId === coach.id || coach.role === "HEAD";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await load();
        setShowForm(false);
        const channels = [
          form.sendSms && "SMS",
          form.sendEmail && "Email",
        ].filter(Boolean);
        const suffix = channels.length > 0 ? ` & ${channels.join(" + ")} sent` : "";
        setForm({ title: "", message: "", imageUrl: "", sendSms: false, sendEmail: false });
        addToast(`Update posted${suffix}`, "success");
      } else {
        addToast("Failed to post update", "error");
      }
    } finally {
      setSending(false);
    }
  }

  async function handleEdit(updateId: string) {
    setEditSaving(true);
    try {
      const res = await fetch(`/api/updates/${updateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setUpdates((prev) => prev.map((u) => (u.id === updateId ? updated : u)));
        setEditingId(null);
        addToast("Update edited", "success");
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to edit update", "error");
      }
    } catch {
      addToast("Failed to edit update", "error");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(updateId: string) {
    if (!window.confirm("Delete this update? This cannot be undone.")) return;
    setDeletingId(updateId);
    try {
      const res = await fetch(`/api/updates/${updateId}`, { method: "DELETE" });
      if (res.ok) {
        setUpdates((prev) => prev.filter((u) => u.id !== updateId));
        addToast("Update deleted", "success");
      } else {
        addToast("Failed to delete update", "error");
      }
    } catch {
      addToast("Failed to delete update", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-secondary">Updates</h1>
          <p className="text-sm text-muted">
            {isCoach ? "Post announcements to families" : "Team announcements"}
          </p>
        </div>
        {isCoach && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Post Update
          </Button>
        )}
      </div>

      {isCoach && showForm && (
        <Card className="mb-4 border-primary">
          <CardContent className="py-4">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-sm">New Update</h3>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Practice Cancelled Tomorrow" required />
              <Textarea label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Details..." rows={3} required />
              <div>
                <Input
                  label="Image URL (optional)"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://i.imgur.com/example.jpg"
                />
                <p className="text-xs text-muted mt-1">
                  Tip: Upload your photo to <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">imgur.com</a> and paste the direct image link here.
                </p>
                {form.imageUrl && (
                  <div className="mt-2 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="max-h-40 rounded-lg border border-border object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      onLoad={(e) => { (e.target as HTMLImageElement).style.display = "block"; }}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Notify families</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.sendSms}
                    onChange={(e) => setForm({ ...form, sendSms: e.target.checked })}
                    className="rounded border-border"
                  />
                  <Send className="h-4 w-4 text-muted" />
                  <span className="text-sm">Send SMS to opted-in families</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.sendEmail}
                    onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}
                    className="rounded border-border"
                  />
                  <Mail className="h-4 w-4 text-muted" />
                  <span className="text-sm">Send email to opted-in families</span>
                </label>
              </div>
              <Button type="submit" size="sm" disabled={sending}>
                {sending ? "Posting..." : "Post Update"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3 animate-fade-in">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : updates.length === 0 ? (
        <p className="text-muted text-sm text-center py-8">No updates yet.</p>
      ) : (
        <div className="space-y-6">
          {groupedUpdates.map((group) => (
            <div key={group.label}>
              <div className="sticky top-14 z-10 bg-background/95 backdrop-blur-sm py-2 mb-2">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">{group.label}</h3>
              </div>
              <div className="space-y-3">
                {group.updates.map((update) => (
                  <div key={update.id} className="bg-surface border border-border rounded-lg p-4">
                    {editingId === update.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleEdit(update.id); }} className="space-y-3">
                        <Input
                          label="Title"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          required
                        />
                        <Textarea
                          label="Message"
                          value={editForm.message}
                          onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                          rows={3}
                          required
                        />
                        <div>
                          <Input
                            label="Image URL (optional)"
                            value={editForm.imageUrl}
                            onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                            placeholder="https://i.imgur.com/example.jpg"
                          />
                          {editForm.imageUrl && (
                            <div className="mt-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={editForm.imageUrl}
                                alt="Preview"
                                className="max-h-40 rounded-lg border border-border object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                onLoad={(e) => { (e.target as HTMLImageElement).style.display = "block"; }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" type="submit" disabled={editSaving}>
                            {editSaving ? "Saving..." : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)} type="button">
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-muted" />
                          <span className="font-medium text-sm flex-1">{update.title}</span>
                          {isCoach && update.smsSent && (
                            <Badge variant="success">SMS ({update.smsCount})</Badge>
                          )}
                          {isCoach && update.emailSent && (
                            <Badge variant="info">Email ({update.emailCount})</Badge>
                          )}
                          {isCoach && canEditUpdate(update) && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingId(update.id);
                                  setEditForm({ title: update.title, message: update.message, imageUrl: update.imageUrl || "" });
                                }}
                                className="p-1 text-muted hover:text-primary rounded"
                                title="Edit update"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(update.id)}
                                disabled={deletingId === update.id}
                                className="p-1 text-muted hover:text-danger rounded"
                                title="Delete update"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{update.message}</p>
                        {update.imageUrl && (
                          <div className="mt-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={update.imageUrl}
                              alt={update.title}
                              className="max-w-full max-h-64 rounded-lg border border-border object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        )}
                        <p className="text-xs text-muted mt-2" title={formatDateTime(update.createdAt)}>
                          {update.coach.name} &middot; {formatRelative(update.createdAt)}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UpdatesPage() {
  return <ToastProvider><UpdatesContent /></ToastProvider>;
}
