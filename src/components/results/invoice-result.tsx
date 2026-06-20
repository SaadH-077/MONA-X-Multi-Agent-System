"use client";

import { Check, AlertTriangle, Building2, FileText, Hash, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Amounts = { net?: string | null; vatRate?: string | null; vatAmount?: string | null; gross?: string | null };
type LineItem = { description: string; qty?: string | null; unitPrice?: string | null; total?: string | null };
type Invoice = {
  summary?: string;
  status?: "approve" | "review";
  supplier?: { name?: string | null; address?: string | null; vatId?: string | null; iban?: string | null };
  invoiceNumber?: string | null;
  poNumber?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  currency?: string | null;
  amounts?: Amounts;
  paymentTerms?: string | null;
  lineItems?: LineItem[];
  department?: { name?: string; confidence?: number; reason?: string };
  validation?: { checks?: { label: string; ok: boolean; note?: string }[]; verdict?: string; nextStep?: string };
  duplicateKey?: string;
  confidence?: number;
};

const cur = (v?: string | null, c?: string | null) =>
  v == null || v === "" ? "—" : `${c ? c + " " : ""}${v}`;

export default function InvoiceResult({ data }: { data: Invoice }) {
  const approve = data.status === "approve";
  const fields: [string, string | null | undefined][] = [
    ["Supplier", data.supplier?.name],
    ["Address", data.supplier?.address],
    ["VAT ID", data.supplier?.vatId],
    ["IBAN / Bank", data.supplier?.iban],
    ["Invoice #", data.invoiceNumber],
    ["PO number", data.poNumber],
    ["Invoice date", data.invoiceDate],
    ["Due date", data.dueDate],
    ["Currency", data.currency],
    ["Payment terms", data.paymentTerms],
  ];

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border px-4 py-3",
          approve
            ? "border-accent-2/40 bg-accent-2/10"
            : "border-accent-3/40 bg-accent-3/10",
        )}
      >
        {approve ? (
          <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent-2" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent-3" />
        )}
        <div>
          <p className="text-sm font-semibold">
            {approve ? "Ready to approve" : "Needs review"}
          </p>
          {data.summary && <p className="mt-0.5 text-sm text-muted">{data.summary}</p>}
        </div>
      </div>

      {/* Amount cards */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Net (before tax)" value={cur(data.amounts?.net, data.currency)} />
        <Stat
          label={`VAT${data.amounts?.vatRate ? ` (${data.amounts.vatRate})` : ""}`}
          value={cur(data.amounts?.vatAmount, data.currency)}
        />
        <Stat label="Gross (total due)" value={cur(data.amounts?.gross, data.currency)} accent />
      </div>

      {/* Key details */}
      <Section icon={Building2} title="Key details">
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {fields.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-border/60 py-1 text-sm">
              <span className="text-muted">{k}</span>
              <span className={cn("text-right font-medium", !v && "text-muted/50")}>
                {v || "—"}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Line items */}
      {data.lineItems && data.lineItems.length > 0 && (
        <Section icon={FileText} title="Line items">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-1.5 pr-3 font-medium">Description</th>
                  <th className="py-1.5 pr-3 font-medium">Qty</th>
                  <th className="py-1.5 pr-3 font-medium">Unit</th>
                  <th className="py-1.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.lineItems.map((li, i) => (
                  <tr key={i} className="border-t border-border/60">
                    <td className="py-1.5 pr-3">{li.description}</td>
                    <td className="py-1.5 pr-3 text-muted">{li.qty ?? "—"}</td>
                    <td className="py-1.5 pr-3 text-muted">{cur(li.unitPrice, data.currency)}</td>
                    <td className="py-1.5 text-right font-medium">{cur(li.total, data.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Routing */}
      {data.department && (
        <Section icon={Hash} title="Department routing">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-accent/15 px-3 py-1.5 text-sm font-semibold text-accent">
              → {data.department.name}
            </span>
            {typeof data.department.confidence === "number" && (
              <ConfidenceBar value={data.department.confidence} />
            )}
          </div>
          {data.department.reason && (
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-foreground">Why: </span>
              {data.department.reason}
            </p>
          )}
        </Section>
      )}

      {/* Validation */}
      {data.validation && (
        <Section icon={Check} title="Validation">
          <ul className="space-y-1.5">
            {data.validation.checks?.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {c.ok ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-3" />
                )}
                <span>
                  <span className="font-medium">{c.label}</span>
                  {c.note && <span className="text-muted"> — {c.note}</span>}
                </span>
              </li>
            ))}
          </ul>
          {data.validation.nextStep && (
            <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <span className="font-medium">Next step: </span>
              {data.validation.nextStep}
            </p>
          )}
        </Section>
      )}

      {/* Footer meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        {typeof data.confidence === "number" && (
          <span>Extraction confidence: {Math.round(data.confidence * 100)}%</span>
        )}
        {data.duplicateKey && (
          <span className="font-mono">dup-key: {data.duplicateKey}</span>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-1 text-lg font-bold", accent && "text-accent")}>{value}</p>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-accent" /> {title}
      </div>
      {children}
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </span>
      {pct}%
    </span>
  );
}
