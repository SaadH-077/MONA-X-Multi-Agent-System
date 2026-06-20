"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Play,
  Loader2,
  Upload,
  X,
  AlertTriangle,
  Sparkles,
  History,
  Clock,
  Globe,
} from "lucide-react";
import { getAgent, getMeta, localizedAgent } from "@/lib/agents";
import { useLang } from "@/components/language-provider";
import ReelPreview from "@/components/reel-preview";
import ShiftBuilder from "@/components/shift-builder";
import AgentChart from "@/components/agent-chart";
import InvoiceResult from "@/components/results/invoice-result";
import ShiftResult from "@/components/results/shift-result";
import PermitResult from "@/components/results/permit-result";
import PricingResult from "@/components/results/pricing-result";
import GapResult from "@/components/results/gap-result";
import SecureResult from "@/components/results/secure-result";
import Flashcards from "@/components/flashcards";
import EmailIntake from "@/components/email-intake";
import DecisionFlow from "@/components/decision-flow";
import ActionBar from "@/components/action-bar";

/** Tolerant JSON extraction. Handles raw JSON, ```fences```, and arrays
   (takes the first object — e.g. a manifest CSV listing several invoices). */
function parseJson<T>(raw: string): T | null {
  const tryParse = (s: string): unknown => {
    try {
      return JSON.parse(s);
    } catch {
      return undefined;
    }
  };
  const unwrap = (v: unknown): T | null => {
    if (Array.isArray(v)) return (v[0] as T) ?? null;
    if (v && typeof v === "object") return v as T;
    return null;
  };
  // 1) direct (JSON mode returns clean JSON)
  let v = tryParse(raw.trim());
  if (v !== undefined) return unwrap(v);
  // 2) fenced
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    v = tryParse(fenced[1].trim());
    if (v !== undefined) return unwrap(v);
  }
  // 3) substring between first/last brace or bracket
  const s = raw.search(/[[{]/);
  const e = Math.max(raw.lastIndexOf("}"), raw.lastIndexOf("]"));
  if (s !== -1 && e !== -1 && e > s) {
    v = tryParse(raw.slice(s, e + 1));
    if (v !== undefined) return unwrap(v);
  }
  return null;
}

type HistEntry = {
  ts: number;
  text: string;
  fileName?: string;
  output: string;
  isDemo: boolean;
};

type AgentFile = { data: string; mimeType: string; name: string };

function fileToBase64(file: File): Promise<AgentFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({
        data: result.split(",")[1] ?? "",
        mimeType: file.type || "application/octet-stream",
        name: file.name,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Big phone-photo scans (some invoices are 5–6MB) — downscale to keep the
// request small while leaving plenty of detail for OCR.
function downscaleImage(file: File): Promise<AgentFile> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 2000;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve({ data: dataUrl.split(",")[1] ?? "", mimeType: "image/jpeg", name: file.name });
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function processFile(file: File): Promise<AgentFile> {
  return file.type.startsWith("image/") ? downscaleImage(file) : fileToBase64(file);
}

export default function AgentRunner({ slug }: { slug: string }) {
  const agent = getAgent(slug);
  const { lang, t } = useLang();
  const [text, setText] = useState("");
  const [file, setFile] = useState<AgentFile | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchStep, setSearchStep] = useState(0);
  const webSearch = !!agent?.webSearch;

  // "Searching the web" staged status for web-search agents.
  useEffect(() => {
    if (!loading || !webSearch) return;
    setSearchStep(0);
    const timers = [0, 1, 2].map((s) => setTimeout(() => setSearchStep(s), s * 1300));
    return () => timers.forEach(clearTimeout);
  }, [loading, webSearch]);

  const histKey = `monax-hist-${slug}`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(histKey);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function saveHistory(entry: HistEntry) {
    setHistory((cur) => {
      const next = [entry, ...cur].slice(0, 12);
      try {
        localStorage.setItem(histKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  if (!agent) return <p className="text-muted">Unknown agent.</p>;

  const meta = getMeta(slug);
  const loc = localizedAgent(slug, agent.title, agent.blurb, agent.tag, lang);
  const showText = agent.inputMode === "text" || agent.inputMode === "both";
  const showFile = agent.inputMode === "file" || agent.inputMode === "both";
  const Icon = agent.icon;

  async function run() {
    setLoading(true);
    setError(null);
    setOutput(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          text,
          language: lang,
          file: file
            ? { data: file.data, mimeType: file.mimeType, name: file.name }
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Agent failed");
      setOutput(data.output);
      setIsDemo(!!data.demo);
      saveHistory({
        ts: Date.now(),
        text,
        fileName: file?.name,
        output: data.output,
        isDemo: !!data.demo,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(await processFile(f));
  }

  const canRun = !loading && (!!text.trim() || !!file);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("allAgents")}
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
          style={{ backgroundColor: meta.color + "22", color: meta.color }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: meta.color }}>
              {meta.codename}
            </h1>
            <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
              {loc.tag}
            </span>
          </div>
          <p className="text-sm font-medium">{loc.title}</p>
          <p className="text-xs text-accent">{agent.customer}</p>
          <p className="mt-1 text-sm text-muted">{loc.blurb}</p>
        </div>
      </div>

      {/* Conversation history (per agent, stored locally) */}
      {history.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
          >
            <History className="h-4 w-4" /> {t("history")} ({history.length})
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1.5">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setOutput(h.output);
                    setIsDemo(h.isDemo);
                    if (h.text) setText(h.text);
                    setShowHistory(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2 text-left text-xs hover:border-accent"
                >
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted" />
                  <span className="shrink-0 text-muted">
                    {new Date(h.ts).toLocaleTimeString()}
                  </span>
                  <span className="truncate">{h.fileName ?? h.text ?? "—"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="glass space-y-3 rounded-2xl p-5">
        {slug === "invoice" && (
          <EmailIntake
            onText={(body) => {
              setText(body);
              setFile(null);
            }}
            onFile={(f) => {
              setFile(f);
              setText("");
            }}
          />
        )}
        {slug === "email-secure" && (
          <EmailIntake
            mode="secure"
            onText={(body) => {
              setText(body);
              setFile(null);
            }}
            onFile={(f) => {
              setFile(f);
              setText("");
            }}
          />
        )}
        {agent.builder === "shift" && <ShiftBuilder onCompose={setText} />}

        {showText && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">
                {agent.textLabel ?? "Input"}
              </label>
              {agent.sample && (
                <button
                  onClick={() => setText(agent.sample!)}
                  className="text-xs text-accent hover:underline"
                >
                  {t("loadSample")}
                </button>
              )}
            </div>
            {agent.quickFills && agent.quickFills.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {agent.quickFills.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => setText(q.value)}
                    className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-foreground"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("typeHere")}
              className="h-40 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent"
            />
          </div>
        )}

        {showFile && (
          <div>
            {!file ? (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted hover:border-accent hover:text-foreground">
                <Upload className="h-4 w-4" />
                {agent.filePrompt ?? "Upload a file"}
                <input
                  type="file"
                  accept={agent.fileAccept}
                  className="hidden"
                  onChange={onFile}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm">
                <span className="truncate">📎 {file.name}</span>
                <button
                  onClick={() => setFile(null)}
                  className="text-muted hover:text-accent-3"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={run}
          disabled={!canRun}
          style={{ backgroundColor: meta.color }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white transition-all active:scale-95 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {loading ? t("running") : t("runAgent")}
        </button>

        {loading && webSearch && (
          <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm">
            <Globe className="h-4 w-4 animate-spin text-accent" />
            <span>
              {["🔎 Searching the web for live signals…", "📡 Reading weather, events & fixtures…", "🧮 Building targeting plan…"][searchStep]}
            </span>
          </div>
        )}
      </div>

      {/* Result */}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-accent-3/40 bg-accent-3/10 px-4 py-3 text-sm text-accent-3">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {output && (
        <div className="mt-6">
          {isDemo && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent-2/40 bg-accent-2/10 px-3 py-1 text-xs text-accent-2">
              <Sparkles className="h-3 w-3" /> {t("demoBadge")}
            </div>
          )}
          <div
            id="agent-result"
            className="glass rounded-2xl p-6"
            style={{ "--accent": meta.color } as React.CSSProperties}
          >
            {agent.kind === "reel" ? (
              <ReelRenderer raw={output} />
            ) : agent.kind === "invoice" ? (
              <StructuredOr raw={output} render={(d) => <InvoiceResult data={d} />} />
            ) : agent.kind === "shift" ? (
              <StructuredOr raw={output} render={(d) => <ShiftResult data={d} />} />
            ) : agent.kind === "permit" ? (
              <StructuredOr raw={output} render={(d) => <PermitResult data={d} />} />
            ) : agent.kind === "pricing" ? (
              <StructuredOr raw={output} render={(d) => <PricingResult data={d} />} />
            ) : agent.kind === "gap" ? (
              <StructuredOr raw={output} render={(d) => <GapResult data={d} />} />
            ) : agent.kind === "secure" ? (
              <StructuredOr raw={output} render={(d) => <SecureResult data={d} />} />
            ) : (
              <Md>{output}</Md>
            )}
          </div>

          {/* The ACTION each agent takes (pricing, gap & secure embed their own) */}
          {slug !== "pricing" && slug !== "gap" && slug !== "email-secure" && (
            <ActionBar slug={slug} raw={output} parsed={parseJson(output)} />
          )}

          {slug === "interview" && (text || file) && (
            <Flashcards context={text || file?.name || ""} />
          )}
          {slug === "cv-fraud" && <DecisionFlow />}
        </div>
      )}
    </div>
  );
}

function ReelRenderer({ raw }: { raw: string }) {
  try {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : raw;
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    const data = JSON.parse(candidate.slice(start, end + 1));
    return <ReelPreview data={data} />;
  } catch {
    return <Md>{raw}</Md>;
  }
}

// Render structured JSON with a dedicated component; if parsing fails, fall
// back to showing the raw text so nothing is ever lost.
function StructuredOr({
  raw,
  render,
}: {
  raw: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: (data: any) => React.ReactNode;
}) {
  const data = parseJson<unknown>(raw);
  if (data) return <>{render(data)}</>;
  return <Md>{raw}</Md>;
}

function Md({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { className, children: kids } = props as {
              className?: string;
              children?: React.ReactNode;
            };
            if (className === "language-chart") {
              try {
                return <AgentChart spec={JSON.parse(String(kids))} />;
              } catch {
                return <code>{String(kids)}</code>;
              }
            }
            return <code className={className}>{kids}</code>;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
