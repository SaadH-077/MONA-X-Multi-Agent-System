"use client";

import { Check, AlertTriangle, X, ShieldCheck, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

type Chk = { label: string; status: "pass" | "warn" | "fail"; note?: string };
type Permit = {
  isWorkPermit?: boolean;
  docType?: string;
  verdict?: "confirm" | "deny";
  headline?: string;
  confidence?: number;
  holder?: string | null;
  documentNo?: string | null;
  nationality?: string | null;
  dob?: string | null;
  category?: string | null;
  legalBasis?: string | null;
  issuingAuthority?: string | null;
  validUntil?: string | null;
  validFrom?: string | null;
  isCurrentlyValid?: boolean;
  daysRemaining?: number;
  employmentPermitted?: boolean;
  employmentNote?: string;
  checks?: Chk[];
  redFlags?: string[];
  keywords?: string[];
};

export default function PermitResult({ data }: { data: Permit }) {
  const confirm = data.verdict === "confirm";
  const conf = Math.max(0, Math.min(100, Math.round(data.confidence ?? 0)));
  const days = data.daysRemaining ?? 0;

  const fields: [string, string | null | undefined][] = [
    ["Holder", data.holder],
    ["Document no.", data.documentNo],
    ["Nationality", data.nationality],
    ["Date of birth", data.dob],
    ["Category", data.category],
    ["Legal basis", data.legalBasis],
    ["Issuing authority", data.issuingAuthority],
    ["Valid from", data.validFrom],
    ["Valid until", data.validUntil],
  ];

  return (
    <div className="space-y-5">
      {/* Verdict banner */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border px-4 py-3",
          confirm ? "border-accent-2/40 bg-accent-2/10" : "border-accent-3/40 bg-accent-3/10",
        )}
      >
        {confirm ? (
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-2" />
        ) : (
          <X className="mt-0.5 h-5 w-5 shrink-0 text-accent-3" />
        )}
        <div>
          <p className="text-sm font-bold uppercase tracking-wide">
            {confirm ? "Confirm" : "Deny"}
          </p>
          {data.headline && <p className="mt-0.5 text-sm text-muted">{data.headline}</p>}
        </div>
      </div>

      {/* Stat row: gauge + validity + employment */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center rounded-xl border border-border p-3">
          <Gauge value={conf} />
          <p className="mt-1 text-xs text-muted">confidence</p>
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-border p-3 text-center">
          <CalendarClock className="mx-auto h-5 w-5 text-accent" />
          <p className={cn("mt-1 text-lg font-bold", days < 0 ? "text-accent-3" : "text-accent-2")}>
            {days < 0 ? "Expired" : `${days}d`}
          </p>
          <p className="text-xs text-muted">{days < 0 ? "past expiry" : "until expiry"}</p>
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-border p-3 text-center">
          <p className="text-2xl">{data.employmentPermitted ? "✅" : "⛔"}</p>
          <p className="mt-1 text-xs font-medium">
            {data.employmentPermitted ? "Work allowed" : "No work"}
          </p>
          {data.employmentNote && (
            <p className="truncate text-[10px] text-muted">{data.employmentNote}</p>
          )}
        </div>
      </div>

      {/* Extracted fields */}
      <div className="rounded-xl border border-border p-4">
        <p className="mb-3 text-sm font-semibold">Extracted fields</p>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {fields.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-border/60 py-1 text-sm">
              <span className="text-muted">{k}</span>
              <span className={cn("text-right font-medium", !v && "text-muted/50")}>{v || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Keywords */}
      {data.keywords && data.keywords.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Key terms detected</p>
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((k, i) => (
              <span key={i} className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Checks */}
      {data.checks && data.checks.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-sm font-semibold">Validation criteria</p>
          <ul className="space-y-1.5">
            {data.checks.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {c.status === "pass" ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" />
                ) : c.status === "warn" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-3" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-accent-3" />
                )}
                <span>
                  <span className="font-medium">{c.label}</span>
                  {c.note && <span className="text-muted"> — {c.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Red flags */}
      {data.redFlags && data.redFlags.length > 0 && (
        <div className="rounded-xl border border-accent-3/40 bg-accent-3/10 p-4">
          <p className="mb-2 text-sm font-semibold text-accent-3">Red flags</p>
          <ul className="space-y-1 text-sm">
            {data.redFlags.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-3" /> {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  const color = value >= 80 ? "#19c39a" : value >= 50 ? "#ffa53b" : "#ff5c7a";
  return (
    <svg width="68" height="68" viewBox="0 0 68 68">
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="7" />
      <circle
        cx="34"
        cy="34"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={off}
        transform="rotate(-90 34 34)"
      />
      <text x="34" y="39" textAnchor="middle" className="fill-foreground text-sm font-bold">
        {value}%
      </text>
    </svg>
  );
}
