"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

interface Session {
  id: string;
  goals: string;
  observations: string | null;
  focusArea: string | null;
  recommendation: string;
  createdAt: string;
}

function CoachingContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
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
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.recommendation);
        setSessions((prev) => [data, ...prev]);
        setQuestion("");
        addToast("Response generated", "success");
      } else {
        addToast(data.error || "Failed to generate response", "error");
      }
    } catch {
      addToast("Failed to generate response", "error");
    } finally {
      setGenerating(false);
    }
  }

  function getSessionLabel(s: Session): string {
    // Use the goals field (which now stores the question text)
    const text = s.goals || s.focusArea || "Coaching Question";
    return text.length > 80 ? text.slice(0, 80) + "..." : text;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-secondary">Coaching Insights</h1>
        <p className="text-sm text-muted">Ask AI for practice plans, drills, strategies, and coaching advice</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" /> Ask AI
          </h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Create a 60-minute practice plan focused on hitting fundamentals, or How should I handle a player who is afraid of the ball?"
              rows={4}
              required
            />
            <Button type="submit" disabled={generating || !question.trim()}>
              {generating ? "Generating..." : "Ask AI"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generating && <div className="flex justify-center py-8"><Spinner size="lg" /></div>}

      {result && !generating && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <h3 className="font-semibold text-sm text-primary">AI Response</h3>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">{result}</div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : sessions.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-secondary mb-3">Previous Questions</h3>
          <div className="space-y-2">
            {sessions.map((s) => (
              <Card key={s.id}>
                <CardContent className="py-3 cursor-pointer" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-2">
                      <span className="text-sm font-medium">{getSessionLabel(s)}</span>
                      <span className="text-xs text-muted ml-2">{formatDateTime(s.createdAt)}</span>
                    </div>
                    {expandedId === s.id ? <ChevronUp className="h-4 w-4 text-muted shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted shrink-0" />}
                  </div>
                  {expandedId === s.id && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="whitespace-pre-wrap text-sm text-gray-700">{s.recommendation}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoachingPage() {
  return <ToastProvider><CoachingContent /></ToastProvider>;
}
