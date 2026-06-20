"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/* Reel agent (P6): a 9:16 phone mock with the platform safe-zone overlays.
   Tabs switch between TikTok and Instagram (their margins differ). */

type Scene = {
  start: number;
  end: number;
  visual: string;
  onScreenText: string;
  vo: string;
};
type Reel = {
  product?: string;
  hook?: string;
  durationSec?: number;
  scenes?: Scene[];
  caption?: string;
  hashtags?: string[];
  safeZoneNote?: string;
  hwgNote?: string;
};

const PLATFORMS = {
  TikTok: { top: "7%", bottom: "30%", right: "15%", left: "4%" },
  Instagram: { top: "6.5%", bottom: "24%", right: "13%", left: "4%" },
} as const;

type Platform = keyof typeof PLATFORMS;

export default function ReelPreview({ data }: { data: Reel }) {
  const [platform, setPlatform] = useState<Platform>("TikTok");
  const z = PLATFORMS[platform];
  const scenes = data.scenes ?? [];

  return (
    <div>
      {/* Platform tabs */}
      <div className="mb-4 inline-flex rounded-xl border border-border p-1 text-sm">
        {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={cn(
              "rounded-lg px-4 py-1.5 font-medium transition-colors",
              platform === p
                ? "bg-accent-3 text-white"
                : "text-muted hover:text-foreground",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        {/* Phone mock */}
        <div className="mx-auto">
          <div
            className="relative overflow-hidden rounded-[30px] border-[5px] border-surface-2 shadow-2xl"
            style={{
              width: 232,
              height: 412,
              background:
                "linear-gradient(160deg,#222a55 0%,#141833 45%,#0a0c24 100%)",
            }}
          >
            {/* unsafe zones */}
            <Zone style={{ top: 0, left: 0, right: 0, height: z.top }} label="top UI" />
            <Zone style={{ bottom: 0, left: 0, right: 0, height: z.bottom }} label="caption · CTA" />
            <Zone style={{ top: 0, bottom: 0, right: 0, width: z.right }} label="actions" vertical />

            {/* message-safe band */}
            <div
              className="absolute rounded-lg border border-dashed border-accent-2/70"
              style={{ top: z.top, bottom: z.bottom, left: z.left, right: z.right }}
            >
              <div className="flex h-full flex-col items-center p-2 text-center">
                <span className="mt-1 rounded bg-accent-2/20 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wide text-accent-2">
                  safe · {platform}
                </span>
                <p className="mt-5 text-balance text-lg font-extrabold leading-tight text-white drop-shadow">
                  {data.hook ?? "Your hook"}
                </p>
                {scenes[0] && (
                  <p className="mt-3 text-xs font-medium text-white/80">
                    {scenes[0].onScreenText}
                  </p>
                )}
              </div>
            </div>

            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-white/40">
              1080×1920 · 9:16
            </span>
          </div>
          {data.product && (
            <p className="mt-2 text-center text-xs text-muted">{data.product}</p>
          )}
        </div>

        {/* Plan */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            {data.durationSec && (
              <span className="rounded-full bg-surface-2 px-2.5 py-1">
                {data.durationSec}s
              </span>
            )}
            <span className="rounded-full bg-accent-2/15 px-2.5 py-1 text-accent-2">
              {platform} safe zones
            </span>
            <span className="rounded-full bg-accent/15 px-2.5 py-1 text-accent">
              HWG-safe
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="border-b border-border py-1.5 pr-3 font-medium">Time</th>
                  <th className="border-b border-border py-1.5 pr-3 font-medium">Visual</th>
                  <th className="border-b border-border py-1.5 font-medium">On-screen</th>
                </tr>
              </thead>
              <tbody>
                {scenes.map((s, i) => (
                  <tr key={i} className="align-top">
                    <td className="border-b border-border py-1.5 pr-3 text-muted whitespace-nowrap">
                      {s.start}–{s.end}s
                    </td>
                    <td className="border-b border-border py-1.5 pr-3">{s.visual}</td>
                    <td className="border-b border-border py-1.5 font-medium">
                      {s.onScreenText}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.caption && (
            <p className="mt-4 text-sm">
              <span className="text-muted">Caption: </span>
              {data.caption}
            </p>
          )}
          {data.hashtags && data.hashtags.length > 0 && (
            <p className="mt-1 text-sm text-accent">{data.hashtags.join(" ")}</p>
          )}
          {data.safeZoneNote && (
            <p className="mt-3 text-xs text-muted">🛡 {data.safeZoneNote}</p>
          )}
          {data.hwgNote && (
            <p className="mt-1 text-xs text-muted">⚖️ {data.hwgNote}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Zone({
  style,
  label,
  vertical,
}: {
  style: React.CSSProperties;
  label: string;
  vertical?: boolean;
}) {
  return (
    <div
      className="absolute z-10 flex items-center justify-center bg-accent-3/10"
      style={style}
    >
      <span
        className={`text-[7px] uppercase tracking-wide text-accent-3/80 ${
          vertical ? "[writing-mode:vertical-rl]" : ""
        }`}
      >
        {label}
      </span>
    </div>
  );
}
