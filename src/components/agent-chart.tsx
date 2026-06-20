"use client";

/* Renders a bar or pie chart from a small JSON spec an agent emits in a
   ```chart fenced block: {"type":"bar"|"pie","title":"…","data":[{"label","value"}]} */

type Datum = { label: string; value: number };
type ChartSpec = { type?: "bar" | "pie"; title?: string; data: Datum[] };

const COLORS = [
  "#2b7fff", "#9b6cff", "#ff6cc4", "#19d3da",
  "#ffa53b", "#3ad07a", "#ff5c7a", "#5cc8ff",
];

export default function AgentChart({ spec }: { spec: ChartSpec }) {
  const data = (spec?.data ?? []).filter((d) => typeof d.value === "number");
  if (!data.length) return null;
  return (
    <div className="my-4 rounded-xl border border-border bg-surface-2/40 p-4">
      {spec.title && <p className="mb-3 text-sm font-semibold">{spec.title}</p>}
      {spec.type === "pie" ? <Pie data={data} /> : <Bars data={data} />}
    </div>
  );
}

function Bars({ data }: { data: Datum[] }) {
  const max = Math.max(...data.map((d) => d.value), 0) || 1;
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-0.5 flex justify-between text-xs">
            <span className="text-muted">{d.label}</span>
            <span className="font-medium">{d.value}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(d.value / max) * 100}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Pie({ data }: { data: Datum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 60;
  const cx = 70;
  const cy = 70;
  let acc = 0;
  const segs = data.map((d, i) => {
    const frac = d.value / total;
    const a0 = acc * 2 * Math.PI;
    acc += frac;
    const a1 = acc * 2 * Math.PI;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + R * Math.sin(a0);
    const y0 = cy - R * Math.cos(a0);
    const x1 = cx + R * Math.sin(a1);
    const y1 = cy - R * Math.cos(a1);
    return {
      d: `M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${R},${R} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`,
      color: COLORS[i % COLORS.length],
      label: d.label,
      pct: Math.round(frac * 100),
    };
  });
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {segs.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} />
        ))}
      </svg>
      <div className="space-y-1 text-xs">
        {segs.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-muted">{s.label}</span>
            <span className="font-medium">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
