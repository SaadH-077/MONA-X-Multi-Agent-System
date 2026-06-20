"use client";

import { useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

export default function Chat({ system }: { system?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
    );

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    scrollToBottom();

    // Add an empty assistant message we'll stream into.
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, system }),
      });

      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: copy[copy.length - 1].content + chunk,
          };
          return copy;
        });
        scrollToBottom();
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "⚠️ Something went wrong reaching the API.",
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass flex h-[600px] flex-col rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium">AI Assistant</span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent-2" />
          live
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted">
            <Sparkles className="mb-3 h-8 w-8 text-accent/50" />
            <p className="text-sm">Ask me anything to get started.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-accent text-white"
                  : "bg-surface-2 text-foreground",
              )}
            >
              {m.content || (
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted" />
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted [animation-delay:0.4s]" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-white transition-all active:scale-95 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
