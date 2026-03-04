"use client";

import { useEffect, useState, useRef } from "react";
import { CoachLayout } from "@/components/layout/coach-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { BookOpen, MessageCircle, Save } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function RulesContent() {
  const [tab, setTab] = useState<"editor" | "chat">("editor");
  const [rulesText, setRulesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/team");
        const team = await res.json();
        if (team?.rulesText) setRulesText(team.rulesText);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function saveRules() {
    setSaving(true);
    try {
      const res = await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rulesText }),
      });
      if (res.ok) addToast("Rules saved", "success");
      else addToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function askQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    const q = question.trim();
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");
    setAsking(true);

    try {
      const res = await fetch("/api/ai/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Failed to get answer. Try again." }]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <CoachLayout>
      <PageHeader title="Rules & AI Assistant" subtitle="League rules with AI-powered lookup" />

      <div className="flex gap-2 mb-4">
        <Button
          variant={tab === "editor" ? "primary" : "outline"}
          size="sm"
          onClick={() => setTab("editor")}
        >
          <BookOpen className="h-4 w-4 mr-1" /> Rules Editor
        </Button>
        <Button
          variant={tab === "chat" ? "primary" : "outline"}
          size="sm"
          onClick={() => setTab("chat")}
        >
          <MessageCircle className="h-4 w-4 mr-1" /> Ask AI
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : tab === "editor" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">League Rules & Regulations</h3>
              <Button size="sm" onClick={saveRules} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              placeholder="Paste or type your Farm-1 league rules here..."
              className="min-h-[400px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="flex flex-col" style={{ height: "calc(100vh - 250px)" }}>
          <CardContent className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-thin">
            {messages.length === 0 && (
              <p className="text-sm text-muted text-center py-8">
                Ask questions about your league rules. Make sure you&apos;ve saved your rules first.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {asking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <Spinner size="sm" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </CardContent>
          <div className="border-t border-border p-3">
            <form onSubmit={askQuestion} className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about a rule..."
                disabled={asking}
                className="flex-1"
              />
              <Button type="submit" disabled={asking} size="sm">Ask</Button>
            </form>
          </div>
        </Card>
      )}
    </CoachLayout>
  );
}

export default function RulesPage() {
  return <ToastProvider><RulesContent /></ToastProvider>;
}
