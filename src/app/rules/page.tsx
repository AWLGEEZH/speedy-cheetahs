"use client";

import { useEffect, useState, useRef } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { BookOpen, MessageCircle, Save, Database, Trash2, FileText, Link, FileUp } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface KbEntry {
  id: string;
  title: string;
  type: "TEXT" | "URL" | "PDF";
  content?: string;
  sourceUrl?: string;
  coach?: { name: string };
  createdAt: string;
}

function RulesContent() {
  const [tab, setTab] = useState<"editor" | "chat" | "knowledge">("editor");
  const [rulesText, setRulesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Knowledge Base state
  const [kbEntries, setKbEntries] = useState<KbEntry[]>([]);
  const [kbType, setKbType] = useState<"TEXT" | "URL" | "PDF">("TEXT");
  const [kbTitle, setKbTitle] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [kbUrl, setKbUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [kbLoading, setKbLoading] = useState(false);

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

  useEffect(() => {
    if (tab === "knowledge") loadKbEntries();
  }, [tab]);

  async function loadKbEntries() {
    try {
      const res = await fetch("/api/knowledge");
      if (res.ok) setKbEntries(Array.isArray(await res.clone().json()) ? await res.json() : []);
    } catch { /* ignore */ }
  }

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
      setMessages((prev) => [...prev, { role: "assistant", content: data.error || data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Failed to get answer. Try again." }]);
    } finally {
      setAsking(false);
    }
  }

  function clearKbForm() {
    setKbTitle(""); setKbContent(""); setKbUrl(""); setPdfFile(null);
  }

  async function addText() {
    if (!kbTitle.trim() || !kbContent.trim()) { addToast("Title and content are required", "error"); return; }
    setKbLoading(true);
    try {
      const res = await fetch("/api/knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "TEXT", title: kbTitle, content: kbContent }) });
      if (res.ok) { addToast("Knowledge entry added", "success"); clearKbForm(); loadKbEntries(); }
      else { const data = await res.json(); addToast(data.error || "Failed to add entry", "error"); }
    } catch { addToast("Failed to add entry", "error"); } finally { setKbLoading(false); }
  }

  async function addUrl() {
    if (!kbTitle.trim() || !kbUrl.trim()) { addToast("Title and URL are required", "error"); return; }
    setKbLoading(true);
    try {
      const res = await fetch("/api/knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "URL", title: kbTitle, sourceUrl: kbUrl }) });
      if (res.ok) { addToast("URL content fetched and added", "success"); clearKbForm(); loadKbEntries(); }
      else { const data = await res.json(); addToast(data.error || "Failed to fetch URL", "error"); }
    } catch { addToast("Failed to fetch URL", "error"); } finally { setKbLoading(false); }
  }

  async function uploadPdf() {
    if (!pdfFile || !kbTitle.trim()) { addToast("Title and PDF file are required", "error"); return; }
    setKbLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("title", kbTitle);
      const res = await fetch("/api/knowledge", { method: "POST", body: formData });
      if (res.ok) { addToast("PDF uploaded and processed", "success"); clearKbForm(); loadKbEntries(); }
      else { const data = await res.json(); addToast(data.error || "Failed to upload PDF", "error"); }
    } catch { addToast("Failed to upload PDF", "error"); } finally { setKbLoading(false); }
  }

  async function deleteKbEntry(id: string) {
    if (!window.confirm("Delete this knowledge base entry?")) return;
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
      if (res.ok) { addToast("Entry deleted", "success"); setKbEntries((prev) => prev.filter((e) => e.id !== id)); }
      else { const data = await res.json(); addToast(data.error || "Failed to delete entry", "error"); }
    } catch { addToast("Failed to delete entry", "error"); }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <PageHeader title="Rules & AI Assistant" subtitle="League rules with AI-powered lookup" />

      <div className="flex gap-2 mb-4">
        <Button variant={tab === "editor" ? "primary" : "outline"} size="sm" onClick={() => setTab("editor")}>
          <BookOpen className="h-4 w-4 mr-1" /> Rules Editor
        </Button>
        <Button variant={tab === "chat" ? "primary" : "outline"} size="sm" onClick={() => setTab("chat")}>
          <MessageCircle className="h-4 w-4 mr-1" /> Ask AI
        </Button>
        <Button variant={tab === "knowledge" ? "primary" : "outline"} size="sm" onClick={() => setTab("knowledge")}>
          <Database className="h-4 w-4 mr-1" /> Knowledge Base
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
      ) : tab === "chat" ? (
        <Card className="flex flex-col" style={{ height: "calc(100vh - 250px)" }}>
          <CardContent className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-thin">
            {messages.length === 0 && (
              <p className="text-sm text-muted text-center py-8">
                Ask questions about your league rules. Make sure you&apos;ve saved your rules first.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${msg.role === "user" ? "bg-primary text-white" : "bg-gray-100 text-gray-800"}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {asking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg"><Spinner size="sm" /></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </CardContent>
          <div className="border-t border-border p-3">
            <form onSubmit={askQuestion} className="flex gap-2">
              <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about a rule..." disabled={asking} className="flex-1" />
              <Button type="submit" disabled={asking} size="sm">Ask</Button>
            </form>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader><h3 className="font-semibold text-sm">Add Knowledge Entry</h3></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button size="sm" variant={kbType === "TEXT" ? "primary" : "outline"} onClick={() => setKbType("TEXT")}>
                  <FileText className="h-4 w-4 mr-1" /> Text
                </Button>
                <Button size="sm" variant={kbType === "URL" ? "primary" : "outline"} onClick={() => setKbType("URL")}>
                  <Link className="h-4 w-4 mr-1" /> URL
                </Button>
                <Button size="sm" variant={kbType === "PDF" ? "primary" : "outline"} onClick={() => setKbType("PDF")}>
                  <FileUp className="h-4 w-4 mr-1" /> PDF
                </Button>
              </div>
              <Input label="Title" value={kbTitle} onChange={(e) => setKbTitle(e.target.value)} placeholder="Entry title" required />
              {kbType === "TEXT" && (
                <>
                  <Textarea value={kbContent} onChange={(e) => setKbContent(e.target.value)} placeholder="Paste or type content..." className="min-h-[150px] text-sm" />
                  <Button size="sm" onClick={addText} disabled={kbLoading}>{kbLoading ? "Adding..." : "Add"}</Button>
                </>
              )}
              {kbType === "URL" && (
                <>
                  <Input label="URL" type="url" value={kbUrl} onChange={(e) => setKbUrl(e.target.value)} placeholder="https://example.com/article" required />
                  <Button size="sm" onClick={addUrl} disabled={kbLoading}>{kbLoading ? "Fetching..." : "Fetch & Add"}</Button>
                </>
              )}
              {kbType === "PDF" && (
                <>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">PDF File</label>
                    <input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:opacity-90" />
                  </div>
                  <Button size="sm" onClick={uploadPdf} disabled={kbLoading}>{kbLoading ? "Uploading..." : "Upload"}</Button>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">Existing Entries ({kbEntries.length})</h3>
            {kbEntries.length === 0 ? (
              <Card><CardContent><p className="text-sm text-muted text-center py-6">No knowledge base entries yet.</p></CardContent></Card>
            ) : (
              kbEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{entry.title}</span>
                          <Badge variant={entry.type === "PDF" ? "info" : entry.type === "URL" ? "success" : "default"}>{entry.type}</Badge>
                        </div>
                        {entry.content && <p className="text-xs text-gray-600 mb-1">{entry.content.length > 150 ? entry.content.substring(0, 150) + "..." : entry.content}</p>}
                        <p className="text-xs text-muted">Added by {entry.coach?.name || "Unknown"} on {new Date(entry.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-danger hover:text-red-700" onClick={() => deleteKbEntry(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RulesPage() {
  return <ToastProvider><RulesContent /></ToastProvider>;
}
