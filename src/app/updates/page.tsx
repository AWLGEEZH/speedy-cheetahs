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
import { formatDateTime } from "@/lib/utils";
import type { UpdateWithCoach } from "@/types";
import { X, MessageSquare, Send, Mail } from "lucide-react";

function UpdatesContent() {
  const [updates, setUpdates] = useState<UpdateWithCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", sendSms: false, sendEmail: false });
  const { addToast } = useToast();

  async function load() {
    try {
      const res = await fetch("/api/updates");
      setUpdates(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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
        setForm({ title: "", message: "", sendSms: false, sendEmail: false });
        addToast(`Update posted${suffix}`, "success");
      } else {
        addToast("Failed to post update", "error");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <CoachLayout>
      <PageHeader
        title="Updates"
        subtitle="Post announcements to families"
        action={{ label: "+ Post Update", onClick: () => setShowForm(true) }}
      />

      {showForm && (
        <Card className="mb-4 border-primary">
          <CardContent className="py-4">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-sm">New Update</h3>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Practice Cancelled Tomorrow" required />
              <Textarea label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Details..." rows={3} required />
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
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : updates.length === 0 ? (
        <p className="text-muted text-sm">No updates yet.</p>
      ) : (
        <div className="space-y-3">
          {updates.map((update) => (
            <Card key={update.id}>
              <CardContent className="py-3">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-muted" />
                  <span className="font-medium text-sm">{update.title}</span>
                  {update.smsSent && (
                    <Badge variant="success">SMS ({update.smsCount})</Badge>
                  )}
                  {update.emailSent && (
                    <Badge variant="info">Email ({update.emailCount})</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{update.message}</p>
                <p className="text-xs text-muted mt-2">
                  {update.coach.name} &middot; {formatDateTime(update.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CoachLayout>
  );
}

export default function UpdatesPage() {
  return <ToastProvider><UpdatesContent /></ToastProvider>;
}
