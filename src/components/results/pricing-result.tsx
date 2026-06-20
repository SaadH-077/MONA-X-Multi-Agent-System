"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, AlertTriangle, ShieldCheck, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Signal = { signal: string; reading: string; direction: "up" | "down" | "flat"; weight: string };
type Guard = { label: string; ok: boolean; note?: string };
type Pricing = {
  product?: string;
  sku?: string | null;
  currency?: string;
  basePrice?: number;
  recommendedPrice?: number;
  deltaPct?: number;
  band?: { min: number; max: number };
  withinBand?: boolean;
  needsBasePrice?: boolean;
  signals?: Signal[];
  guardrails?: Guard[];
  rationale?: string;
  auditLine?: string;
};

const eur = (n?: number) => (typeof n === "number" ? `€${n.toFixed(2)}` : "—");
const arrow = (d: string) => (d === "up" ? "↑" : d === "down" ? "↓" : "→");

export default function PricingResult({ data }: { data: Pricing }) {
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const up = (data.deltaPct ?? 0) >= 0;
  const allGuardsOk = (data.guardrails ?? []).every((g) => g.ok);

  function apply() {
    setApplying(true);
    setTimeout(() => {
      setApplying(false);
      setApplied(true);
      try {
        const book = JSON.parse(localStorage.getItem("monax-pricebook") || "[]");
        book.unshift({
          ts: Date.now(),
          product: data.product,
          sku: data.sku,
          from: data.basePrice,
          to: data.recommendedPrice,
          deltaPct: data.deltaPct,
          audit: data.auditLine,
        });
        localStorage.setItem("monax-pricebook", JSON.stringify(book.slice(0, 50)));
      } catch {}
    }, 1400);
  }

  if (data.needsBasePrice) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-accent-3/40 bg-accent-3/10 px-4 py-3 text-sm">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent-3" />
        <div>
          <p className="font-semibold">Need a base price</p>
          <p className="text-muted">{data.rationale ?? "This product isn't in the catalogue — provide its current base price and I'll recommend a change."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm font-semibold">{data.product}{data.sku ? ` · ${data.sku}` : ""}</p>

      {/* Before → After */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-border p-5">
        <div className="text-center">
          <p className="text-xs text-muted">Current</p>
          <p className="text-3xl font-bold">{eur(data.basePrice)}</p>
        </div>
        <ArrowRight className="h-6 w-6 text-muted" />
        <div className="text-center">
          <p className="text-xs text-muted">{applied ? "Applied" : "Recommended"}</p>
          <motion.p
            key={applied ? "a" : "r"}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn("text-3xl font-bold", applied ? "text-accent-2" : "text-accent")}
          >
            {eur(data.recommendedPrice)}
          </motion.p>
          <p className={cn("text-xs font-medium", up ? "text-accent-2" : "text-accent-3")}>
            {up ? "+" : ""}{data.deltaPct?.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Band visual */}
      {data.band && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>floor {eur(data.band.min)}</span>
            <span>±12% safe band</span>
            <span>ceiling {eur(data.band.max)}</span>
          </div>
          <div className="relative h-2.5 w-full rounded-full bg-surface-2">
            {(() => {
              const lo = data.band.min, hi = data.band.max;
              const pos = (v?: number) => v == null ? 0 : Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
              return (
                <>
                  <span className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-muted" style={{ left: `${pos(data.basePrice)}%` }} />
                  <motion.span
                    className="absolute top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-full bg-accent"
                    initial={{ left: `${pos(data.basePrice)}%` }}
                    animate={{ left: `${pos(data.recommendedPrice)}%` }}
                    transition={{ duration: 1 }}
                  />
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Signals */}
      {data.signals && data.signals.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-2 text-sm font-semibold">📡 Signals</p>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[380px] text-sm">
            <tbody>
              {data.signals.map((s, i) => (
                <tr key={i} className="border-t border-border/60 first:border-0">
                  <td className="py-1.5 font-medium">{s.signal}</td>
                  <td className="py-1.5 text-muted">{s.reading}</td>
                  <td className="py-1.5 text-center">{arrow(s.direction)}</td>
                  <td className="py-1.5 text-right text-xs text-muted">{s.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Guardrails */}
      {data.guardrails && (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-accent" /> Guardrail check
          </p>
          <ul className="space-y-1.5">
            {data.guardrails.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {g.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-3" />}
                <span><span className="font-medium">{g.label}</span>{g.note && <span className="text-muted"> — {g.note}</span>}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.rationale && <p className="text-sm text-muted">{data.rationale}</p>}

      {/* Human-in-the-loop approval gate */}
      <div className="rounded-2xl border border-border p-5">
        {!applied ? (
          <>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
              <Lock className="h-4 w-4 text-accent" /> Human approval required
            </p>
            <p className="mb-3 text-xs text-muted">
              No price changes without a person. Review the guardrails, then approve to write it to the price book.
            </p>
            {!allGuardsOk && (
              <p className="mb-3 rounded-lg bg-accent-3/10 px-3 py-2 text-xs text-accent-3">
                ⚠️ A guardrail failed — approving is blocked.
              </p>
            )}
            <button
              onClick={apply}
              disabled={!allGuardsOk || applying}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {applying ? "Applying…" : `Approve & apply ${eur(data.recommendedPrice)}`}
            </button>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 text-sm font-semibold text-accent-2">
              <Check className="h-5 w-5" /> Price change applied & logged
            </div>
            <p className="mt-1 text-sm text-muted">
              {data.product}: <span className="line-through">{eur(data.basePrice)}</span> →{" "}
              <span className="font-semibold text-foreground">{eur(data.recommendedPrice)}</span> · written to the price book (verifiable, with audit trail).
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-2 p-3 text-xs">
{JSON.stringify(
  { product: data.product, sku: data.sku, from: data.basePrice, to: data.recommendedPrice, deltaPct: data.deltaPct, appliedAt: new Date().toISOString(), audit: data.auditLine },
  null,
  2,
)}
            </pre>
          </motion.div>
        )}
      </div>
    </div>
  );
}
