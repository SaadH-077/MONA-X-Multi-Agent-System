"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, Check, X, Search, Loader2, Database, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

type Doc = { type: string; present: boolean; evidence?: string };
type Secure = {
  injectionDetected?: boolean;
  injectionQuote?: string;
  threatLevel?: "none" | "low" | "high";
  applicant?: { name?: string | null; role?: string | null; email?: string | null };
  documents?: Doc[];
  complete?: boolean;
  missing?: string[];
  recommendation?: string;
};

export default function SecureResult({ data }: { data: Secure }) {
  const inj = data.injectionDetected;
  const [checking, setChecking] = useState(false);
  const [checkStep, setCheckStep] = useState(0);
  const [checkDone, setCheckDone] = useState(false);

  const STEPS = [
    "Connecting to Federal criminal records (BZR)…",
    "Matching applicant identity…",
    "Cross-checking sanctions & watchlists…",
    "Compiling clearance result…",
  ];

  function runCriminalCheck() {
    setChecking(true);
    setCheckStep(0);
    setCheckDone(false);
    STEPS.forEach((_, i) => setTimeout(() => setCheckStep(i), i * 1400));
    setTimeout(() => {
      setChecking(false);
      setCheckDone(true);
    }, STEPS.length * 1400);
  }

  return (
    <div className="space-y-5">
      {/* Threat banner */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border px-4 py-3",
          inj ? "border-accent-3/50 bg-accent-3/10" : "border-accent-2/40 bg-accent-2/10",
        )}
      >
        {inj ? (
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent-3" />
        ) : (
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-2" />
        )}
        <div>
          <p className="text-sm font-bold">
            {inj ? "⚠️ Prompt-injection attempt DETECTED & BLOCKED" : "No injection detected"}
            {data.threatLevel && (
              <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium uppercase">
                threat: {data.threatLevel}
              </span>
            )}
          </p>
          {inj && data.injectionQuote && (
            <p className="mt-1 text-sm text-muted">
              Embedded instruction <span className="italic">“{data.injectionQuote}”</span> was treated as
              untrusted data, <b>not executed</b>, and flagged. No data was exported or sent.
            </p>
          )}
        </div>
      </div>

      {/* Applicant */}
      {data.applicant && (
        <div className="rounded-xl border border-border p-4 text-sm">
          <span className="text-muted">Applicant (extracted as data only): </span>
          <span className="font-medium">
            {[data.applicant.name, data.applicant.role, data.applicant.email].filter(Boolean).join(" · ") || "—"}
          </span>
        </div>
      )}

      {/* Document checklist */}
      {data.documents && (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-sm font-semibold">Required documents</p>
          <div className="space-y-2">
            {data.documents.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-surface-2/50 px-3 py-2">
                {d.present ? (
                  <Check className="h-5 w-5 shrink-0 text-accent-2" />
                ) : (
                  <X className="h-5 w-5 shrink-0 text-accent-3" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{d.type}</p>
                  {d.evidence && <p className="text-xs text-muted">{d.evidence}</p>}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    d.present ? "bg-accent-2/15 text-accent-2" : "bg-accent-3/15 text-accent-3",
                  )}
                >
                  {d.present ? "Present" : "Missing"}
                </span>
              </div>
            ))}
          </div>
          <div
            className={cn(
              "mt-3 rounded-lg px-3 py-2 text-sm font-medium",
              data.complete ? "bg-accent-2/10 text-accent-2" : "bg-accent-3/10 text-accent-3",
            )}
          >
            {data.complete
              ? "✅ Application complete — all required documents present."
              : `❌ Incomplete — missing: ${(data.missing ?? []).join(", ")}`}
          </div>
        </div>
      )}

      {data.recommendation && (
        <div className="flex items-start gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm">
          <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span><span className="font-medium">Recommended action: </span>{data.recommendation}</span>
        </div>
      )}

      {/* ACTION: criminal-record database check */}
      <div className="rounded-2xl border border-border p-5">
        <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
          <Database className="h-4 w-4 text-accent" /> Criminal-record database check
        </p>
        <p className="mb-3 text-xs text-muted">
          Run an automated background check against the criminal-records registry (simulated).
        </p>

        {!checking && !checkDone && (
          <button
            onClick={runCriminalCheck}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Search className="h-4 w-4" /> Run background check
          </button>
        )}

        {checking && (
          <div className="space-y-2">
            {STEPS.map((s, i) => (
              <div key={i} className={cn("flex items-center gap-2 text-sm", i <= checkStep ? "opacity-100" : "opacity-40")}>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-2">
                  {i < checkStep ? <Check className="h-3.5 w-3.5 text-accent-2" /> : i === checkStep ? <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" /> : <Database className="h-3 w-3 text-muted" />}
                </span>
                {s}
              </div>
            ))}
          </div>
        )}

        {checkDone && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-accent-2/40 bg-accent-2/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-accent-2">
              <ShieldCheck className="h-5 w-5" /> Background check complete — no records found
            </p>
            <p className="mt-1 text-sm text-muted">
              {data.applicant?.name ?? "Applicant"} returned <b>clear</b> against the criminal-records registry and sanctions/watchlists (simulated). Result logged to the audit trail.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
