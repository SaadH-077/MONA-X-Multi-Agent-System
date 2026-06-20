"use client";

import { useState } from "react";
import { Phone, MessageSquare, Check, X, Copy, Trophy, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

/* Deterministic avatar per name (so the same nurse always gets the same face). */
function avatarFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 70;
  return `https://i.pravatar.cc/80?img=${h + 1}`;
}

type Candidate = {
  name: string;
  dept?: string;
  certs?: string;
  headroomHrs?: number;
  overtimeOk?: boolean;
  contract?: string;
  phone?: string;
  score?: number;
  why?: string;
};
type Shift = {
  gap?: string;
  candidates?: Candidate[];
  excluded?: { name: string; reason: string }[];
  draftedMessage?: string;
  backupMessage?: string;
  recommendation?: string;
};

export default function ShiftResult({ data }: { data: Shift }) {
  const cands = (data.candidates ?? []).slice().sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const maxScore = Math.max(...cands.map((c) => c.score ?? 0), 100);

  return (
    <div className="space-y-5">
      {data.gap && (
        <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          <span className="font-semibold">Gap: </span>
          {data.gap}
        </div>
      )}

      {/* Ranked candidates */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <Trophy className="h-4 w-4 text-accent" /> Top picks
        </p>
        <div className="space-y-2.5">
          {cands.map((c, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl border p-4",
                i === 0 ? "border-accent/50 bg-accent/5" : "border-border",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarFor(c.name)}
                      alt={c.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ring-2 ring-surface",
                        i === 0 ? "bg-accent text-white" : "bg-surface-2 text-muted",
                      )}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted">
                      {[c.dept, c.certs, c.contract].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
                {typeof c.score === "number" && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-accent">{c.score}</p>
                    <p className="text-[10px] text-muted">fit score</p>
                  </div>
                )}
              </div>

              {typeof c.score === "number" && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                    style={{ width: `${((c.score ?? 0) / maxScore) * 100}%` }}
                  />
                </div>
              )}

              {c.why && <p className="mt-2 text-sm text-muted">{c.why}</p>}

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                {typeof c.headroomHrs === "number" && <span>🕒 {c.headroomHrs}h headroom</span>}
                <span>{c.overtimeOk ? "✅ OT willing" : "⛔ no OT"}</span>
                {c.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {c.phone}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drafted messages */}
      {(data.draftedMessage || data.backupMessage) && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <MessageSquare className="h-4 w-4 text-accent" /> Ready-to-send messages
          </p>
          <div className="space-y-2">
            {data.draftedMessage && (
              <SmsCard label="To #1 pick" text={data.draftedMessage} phone={cands[0]?.phone} />
            )}
            {data.backupMessage && (
              <SmsCard label="To backup" text={data.backupMessage} phone={cands[1]?.phone} />
            )}
          </div>
        </div>
      )}

      {/* Excluded */}
      {data.excluded && data.excluded.length > 0 && (
        <details className="rounded-xl border border-border p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Excluded ({data.excluded.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {data.excluded.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-3" />
                <span>
                  <span className="font-medium">{e.name}</span>
                  <span className="text-muted"> — {e.reason}</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {data.recommendation && (
        <div className="flex items-start gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" />
          <span>
            <span className="font-medium">Action: </span>
            {data.recommendation}
          </span>
        </div>
      )}
    </div>
  );
}

function SmsCard({ label, text, phone }: { label: string; text: string; phone?: string }) {
  const [copied, setCopied] = useState(false);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
    "Shift cover request — UKS HR",
  )}&body=${encodeURIComponent(text)}`;
  const smsUrl = phone ? `sms:${phone.replace(/\s/g, "")}?body=${encodeURIComponent(text)}` : null;

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
        >
          <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="text-sm">{text}</p>
      <div className="mt-2 flex gap-2">
        <a
          href={gmailUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white"
        >
          <Mail className="h-3.5 w-3.5" /> Send via Gmail
        </a>
        {smsUrl && (
          <a
            href={smsUrl}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-accent"
          >
            <MessageSquare className="h-3.5 w-3.5" /> Send SMS
          </a>
        )}
      </div>
    </div>
  );
}
