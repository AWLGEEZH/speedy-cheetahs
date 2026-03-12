"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatRelative } from "@/lib/utils";
import { Send, MessageCircle } from "lucide-react";

interface ChatMsg {
  id: string;
  content: string;
  createdAt: string;
  coach: { id: string; name: string };
}

export default function ChatPage() {
  const { isCoach, coach, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initial load
  useEffect(() => {
    async function loadAll() {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const msgs: ChatMsg[] = await res.json();
          setMessages(msgs);
          if (msgs.length > 0) {
            lastTimestampRef.current = msgs[msgs.length - 1].createdAt;
          }
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    if (isCoach) loadAll();
  }, [isCoach]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Polling for new messages
  useEffect(() => {
    if (!isCoach) return;

    const poll = async () => {
      try {
        const after = lastTimestampRef.current;
        const url = after ? `/api/chat?after=${encodeURIComponent(after)}` : "/api/chat";
        const res = await fetch(url);
        if (res.ok) {
          const newMsgs: ChatMsg[] = await res.json();
          if (newMsgs.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const unique = newMsgs.filter((m) => !existingIds.has(m.id));
              if (unique.length === 0) return prev;
              return [...prev, ...unique];
            });
            lastTimestampRef.current = newMsgs[newMsgs.length - 1].createdAt;
          }
        }
      } catch { /* ignore */ }
    };

    const interval = setInterval(poll, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isCoach]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const msg: ChatMsg = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        lastTimestampRef.current = msg.createdAt;
        setInput("");
      }
    } catch { /* ignore */ }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isCoach) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <MessageCircle className="h-12 w-12 text-muted mx-auto mb-4" />
        <h1 className="text-xl font-bold text-secondary mb-2">Coaches Chat</h1>
        <p className="text-muted">Please log in as a coach to access the chat.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-secondary">Coaches Chat</h1>
        <p className="text-sm text-muted">Private discussion area for coaching staff</p>
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-gray-50 rounded-lg border border-border p-4 space-y-3 min-h-0"
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-muted text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.coach.id === coach?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    isMe
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-white border border-border rounded-bl-sm"
                  }`}
                >
                  {!isMe && (
                    <p className={`text-xs font-semibold mb-0.5 ${isMe ? "text-white/80" : "text-primary"}`}>
                      {msg.coach.name}
                    </p>
                  )}
                  <p className={`text-sm whitespace-pre-wrap break-words ${isMe ? "text-white" : "text-gray-900"}`}>
                    {msg.content}
                  </p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "text-gray-400"}`}>
                    {formatRelative(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="mt-3 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          style={{ maxHeight: "120px" }}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="shrink-0 h-10 w-10 p-0 flex items-center justify-center"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
