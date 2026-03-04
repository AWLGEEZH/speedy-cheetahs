"use client";

import { useEffect, useState } from "react";
import { CoachLayout } from "@/components/layout/coach-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

interface Session {
  id: string;
  goals: string;
  observations: string;
  focusArea: string | null;
  recommendation: string;
  createdAt: string;
}

function CoachingContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ goals: "", observations: "", focusArea: "" });
  const [result, setResult] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/ai/coaching");
        if (res.ok) setSessions(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.recommendation);
        setSessions((prev) => [data, ...prev]);
        addToast("Practice plan generated", "success");
      } else {
        addToast(data.error || "Failed to generate plan", "error");
      }
    } catch {
      addToast("Failed to generate plan", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <CoachLayout>
      <PageHeader title="AI Coaching Assistant" subtitle="Get practice plan recommendations" />

      {/* Input Form */}
      <Card className="mb-6">
        <CardHeader>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" /> Generate Practice Plan
          </h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              label="Coaching Goals"
              value={form.goals}
              onChange={(e) => setForm({ ...form, goals: e.target.value })}
              placeholder="What do you want to focus on? e.g. Improve batting stance, work on throwing accuracy..."
              rows={3}
              required
            />
            <Textarea
              label="Player Observations"
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              placeholder="What have you noticed? e.g. Several kids struggle with catching fly balls, most kids batting well off the tee..."
              rows={3}
              required
            />
            <Input
              label="Focus Area (optional)"
              value={form.focusArea}
              onChange={(e) => setForm({ ...form, focusArea: e.target.value })}
              placeholder="e.g. Hitting, Fielding, Base Running, Throwing"
            />
            <Button type="submit" disabled={generating}>
              {generating ? "Generating..." : "Generate Practice Plan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Generated Result */}
      {generating && (
        <div className="flex justify-center py-8"><Spinner size="lg" /></div>
      )}

      {result && !generating && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <h3 className="font-semibold text-sm text-primary">Generated Practice Plan</h3>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
              {result}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : sessions.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-secondary mb-3">Previous Plans</h3>
          <div className="space-y-2">
            {sessions.map((s) => (
              <Card key={s.id}>
                <CardContent
                  className="py-3 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">
                        {s.focusArea || "General"} Practice Plan
                      </span>
                      <span className="text-xs text-muted ml-2">
                        {formatDateTime(s.createdAt)}
                      </span>
                    </div>
                    {expandedId === s.id ? (
                      <ChevronUp className="h-4 w-4 text-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted" />
                    )}
                  </div>
                  {expandedId === s.id && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="whitespace-pre-wrap text-sm text-gray-700">
                        {s.recommendation}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </CoachLayout>
  );
}

export default function CoachingPage() {
  return <ToastProvider><CoachingContent /></ToastProvider>;
}
