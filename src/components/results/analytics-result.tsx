"use client";

import { Globe, Target, CalendarClock } from "lucide-react";
import AgentChart from "@/components/agent-chart";

type Seg = { name: string; skus: string; affinity?: string; value?: string };
type Plan = { segment: string; sku: string; window: string; why: string };
type Analytics = {
  summary?: string;
  groundedOn?: string;
  demandChart?: { title?: string; data?: { label: string; value: number }[] };
  segments?: Seg[];
  plan?: Plan[];
  measurement?: string;
};

export default function AnalyticsResult({ data }: { data: Analytics }) {
  return (
    <div className="space-y-5">
      {data.summary && <p className="text-sm font-medium">{data.summary}</p>}

      {data.groundedOn && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span><span className="font-medium">Live signal: </span>{data.groundedOn}</span>
        </div>
      )}

      {data.demandChart?.data && data.demandChart.data.length > 0 && (
        <AgentChart spec={{ type: "bar", title: data.demandChart.title, data: data.demandChart.data }} />
      )}

      {data.segments && data.segments.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Target className="h-4 w-4 text-accent" /> Segments (RFM + affinity)
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-1.5 pr-3 font-medium">Segment</th>
                <th className="py-1.5 pr-3 font-medium">SKUs</th>
                <th className="py-1.5 pr-3 font-medium">Affinity</th>
                <th className="py-1.5 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.segments.map((s, i) => (
                <tr key={i} className="border-t border-border/60 align-top">
                  <td className="py-1.5 pr-3 font-medium">{s.name}</td>
                  <td className="py-1.5 pr-3 text-muted">{s.skus}</td>
                  <td className="py-1.5 pr-3">
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">{s.affinity ?? "—"}</span>
                  </td>
                  <td className="py-1.5 text-accent">{s.value ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.plan && data.plan.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-accent" /> Targeting plan
          </p>
          <div className="space-y-2">
            {data.plan.map((p, i) => (
              <div key={i} className="rounded-lg bg-surface-2/50 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="font-medium">{p.segment}</span>
                  <span className="text-muted">×</span>
                  <span className="font-medium text-accent">{p.sku}</span>
                  <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                    {p.window}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">{p.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.measurement && (
        <div className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
          <span className="font-medium">🔬 Lift measurement: </span>
          {data.measurement}
        </div>
      )}
    </div>
  );
}
