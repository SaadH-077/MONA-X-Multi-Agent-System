"use client";

import { Target, Sparkles, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { printReport, esc } from "@/lib/actions";

type Cell = { need: string; format: string; status: "have" | "gap" | "none"; who?: string };
type Opp = {
  title: string;
  why: string;
  difficulty: string;
  fit: string;
  productIdea: string;
  competitor?: string;
};
type Gap = {
  needs?: string[];
  formats?: string[];
  grid?: Cell[];
  opportunities?: Opp[];
  quickWin?: string;
};

export default function GapResult({ data }: { data: Gap }) {
  const needs = data.needs ?? [];
  const formats = data.formats ?? [];
  const cellOf = (n: string, f: string) =>
    (data.grid ?? []).find((c) => c.need === n && c.format === f);

  function brief(o: Opp) {
    printReport({
      title: `Product Concept Brief — ${o.title}`,
      subtitle: "VANTAGE · Competitive gap analysis",
      accent: "#3ad07a",
      bodyHtml: `
        <h2>Opportunity</h2>
        <p><b>${esc(o.title)}</b> — ${esc(o.why)}</p>
        <div class="kv">
          <div>Proposed product</div><div>${esc(o.productIdea)}</div>
          <div>Fills gap vs.</div><div>${esc(o.competitor || "—")}</div>
          <div>Brand fit</div><div>${esc(o.fit)}</div>
          <div>Difficulty</div><div>${esc(o.difficulty)}</div>
        </div>
        <h2>Why now</h2>
        <ul>
          <li>Competitor present in this need×format cell; Allgäuer Latschenkiefer absent.</li>
          <li>Leverages the brand's existing distribution (pharmacies) and ingredient credibility.</li>
        </ul>
        <h2>Suggested next steps</h2>
        <ul>
          <li>Validate demand with a 2-week pharmacy-channel test.</li>
          <li>Brief R&amp;D on a ${esc(o.productIdea)} prototype.</li>
          <li>Define pricing vs. ${esc(o.competitor || "category")}.</li>
        </ul>
        <p style="color:#999;font-size:11px">Positioning is a starting hypothesis — validate before committing budget.</p>`,
    });
  }

  return (
    <div className="space-y-5">
      {/* Coverage grid */}
      {needs.length > 0 && formats.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Target className="h-4 w-4 text-accent" /> Coverage map · need × format
          </p>
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-1.5"></th>
                  {formats.map((f) => (
                    <th key={f} className="p-1.5 text-center font-medium text-muted">{f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {needs.map((n) => (
                  <tr key={n}>
                    <td className="whitespace-nowrap p-1.5 pr-3 font-medium">{n}</td>
                    {formats.map((f) => {
                      const c = cellOf(n, f);
                      const s = c?.status ?? "none";
                      return (
                        <td key={f} className="p-1">
                          <div
                            title={c?.who ?? ""}
                            className={cn(
                              "grid h-8 w-12 place-items-center rounded-md text-[10px] font-semibold",
                              s === "have" && "bg-accent-2/20 text-accent-2",
                              s === "gap" && "bg-accent-3/25 text-accent-3 ring-1 ring-accent-3/50",
                              s === "none" && "bg-surface-2 text-muted/40",
                            )}
                          >
                            {s === "have" ? "✓" : s === "gap" ? "GAP" : "·"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted">
            <span><span className="text-accent-2">✓</span> we cover</span>
            <span><span className="text-accent-3">GAP</span> white-space (competitor present, we're absent)</span>
            <span>· nobody</span>
          </div>
        </div>
      )}

      {/* Opportunities */}
      {data.opportunities && data.opportunities.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Top white-space opportunities</p>
          <div className="space-y-2.5">
            {data.opportunities.map((o, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{i + 1}. {o.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{o.why}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5 text-[10px]">
                    <span className="rounded-full bg-accent-2/15 px-2 py-0.5 text-accent-2">fit {o.fit}</span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">{o.difficulty}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm">
                  💡 <span className="font-medium">{o.productIdea}</span>
                  {o.competitor && o.competitor !== "—" && (
                    <span className="text-muted"> · vs. {o.competitor}</span>
                  )}
                </p>
                <button
                  onClick={() => brief(o)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  <FileText className="h-3.5 w-3.5" /> Draft product brief
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.quickWin && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span><span className="font-semibold">Quick win: </span>{data.quickWin}</span>
        </div>
      )}
    </div>
  );
}
