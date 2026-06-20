"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* Reel agent (P6): 9:16 phone mock with platform safe-zone overlays + animated
   storyboard playback + optional AI-generated keyframe images (HF FLUX). */

type Scene = { start: number; end: number; visual: string; onScreenText: string; vo: string };
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
  const scenes = data.scenes ?? [];
  const total = data.durationSec || scenes[scenes.length - 1]?.end || 15;

  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const [frames, setFrames] = useState<(string | null)[]>([]);
  const [genState, setGenState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [genMsg, setGenMsg] = useState("");

  // playback clock
  useEffect(() => {
    if (!playing) return;
    startRef.current = performance.now() - t * 1000;
    const tick = (now: number) => {
      const el = (now - startRef.current) / 1000;
      if (el >= total) {
        setT(0);
        setPlaying(false);
        return;
      }
      setT(el);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const activeIdx = Math.max(
    0,
    scenes.findIndex((s) => t >= s.start && t < s.end),
  );
  const active = scenes[activeIdx] ?? scenes[0];
  const z = PLATFORMS[platform];

  async function generateVisuals() {
    if (!scenes.length) return;
    setGenState("loading");
    setGenMsg("Generating AI keyframes with FLUX…");
    try {
      const results = await Promise.all(
        scenes.map(async (s) => {
          try {
            const r = await fetch("/api/hf-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: `${data.product ?? ""} — ${s.visual}` }),
            });
            const d = await r.json();
            return d.dataUrl ?? null;
          } catch {
            return null;
          }
        }),
      );
      setFrames(results);
      const ok = results.filter(Boolean).length;
      if (ok === 0) {
        setGenState("error");
        setGenMsg("AI image model unavailable right now — storyboard playback still works.");
      } else {
        setGenState("done");
        setGenMsg(`${ok}/${scenes.length} AI keyframes generated.`);
      }
    } catch {
      setGenState("error");
      setGenMsg("AI image model unavailable right now — storyboard playback still works.");
    }
  }

  const bg = frames[activeIdx];

  return (
    <div>
      {/* Platform tabs + controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-border p-1 text-sm">
          {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={cn(
                "rounded-lg px-4 py-1.5 font-medium transition-colors",
                platform === p ? "bg-accent text-white" : "text-muted hover:text-foreground",
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? "Pause" : "Play reel"}
        </button>
        <button
          onClick={generateVisuals}
          disabled={genState === "loading"}
          className="inline-flex items-center gap-2 rounded-xl border border-accent/40 px-4 py-2 text-sm font-medium text-accent disabled:opacity-50"
        >
          {genState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate AI visuals
        </button>
      </div>

      {genMsg && (
        <p className={cn("mb-3 text-xs", genState === "error" ? "text-accent-3" : "text-muted")}>{genMsg}</p>
      )}

      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        {/* Phone mock */}
        <div className="mx-auto">
          <div
            className="relative overflow-hidden rounded-[30px] border-[5px] border-surface-2 shadow-2xl"
            style={{
              width: 236,
              height: 420,
              background: bg
                ? undefined
                : "linear-gradient(160deg,#222a55 0%,#141833 45%,#0a0c24 100%)",
            }}
          >
            {/* AI keyframe background (cross-fades per scene) */}
            <AnimatePresence>
              {bg && (
                <motion.img
                  key={activeIdx + (bg ? "img" : "")}
                  src={bg}
                  alt=""
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </AnimatePresence>
            {bg && <div className="absolute inset-0 bg-black/25" />}

            {/* unsafe zones */}
            <Zone style={{ top: 0, left: 0, right: 0, height: z.top }} label="top UI" />
            <Zone style={{ bottom: 0, left: 0, right: 0, height: z.bottom }} label="caption · CTA" />
            <Zone style={{ top: 0, bottom: 0, right: 0, width: z.right }} label="actions" vertical />

            {/* message-safe band */}
            <div
              className="absolute rounded-lg border border-dashed border-accent-2/60"
              style={{ top: z.top, bottom: z.bottom, left: z.left, right: z.right }}
            >
              <div className="flex h-full flex-col items-center p-2 text-center">
                <span className="mt-1 rounded bg-accent-2/20 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wide text-accent-2">
                  safe · {platform}
                </span>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activeIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-5 text-balance text-lg font-extrabold leading-tight text-white drop-shadow-lg"
                  >
                    {playing || frames.length ? active?.onScreenText : data.hook}
                  </motion.p>
                </AnimatePresence>
                {!playing && !frames.length && scenes[0] && (
                  <p className="mt-3 text-xs font-medium text-white/80">{scenes[0].onScreenText}</p>
                )}
              </div>
            </div>

            {/* progress bar */}
            <div className="absolute bottom-1.5 left-3 right-3 h-1 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-accent-2" style={{ width: `${(t / total) * 100}%` }} />
            </div>
          </div>
          {data.product && <p className="mt-2 text-center text-xs text-muted">{data.product}</p>}
        </div>

        {/* Plan */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-surface-2 px-2.5 py-1">{total}s</span>
            <span className="rounded-full bg-accent-2/15 px-2.5 py-1 text-accent-2">{platform} safe zones</span>
            <span className="rounded-full bg-accent/15 px-2.5 py-1 text-accent">HWG-safe</span>
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
                  <tr
                    key={i}
                    className={cn("align-top transition-colors", i === activeIdx && (playing || frames.length > 0) && "bg-accent/10")}
                  >
                    <td className="border-b border-border py-1.5 pr-3 whitespace-nowrap text-muted">{s.start}–{s.end}s</td>
                    <td className="border-b border-border py-1.5 pr-3">{s.visual}</td>
                    <td className="border-b border-border py-1.5 font-medium">{s.onScreenText}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.caption && <p className="mt-4 text-sm"><span className="text-muted">Caption: </span>{data.caption}</p>}
          {data.hashtags && data.hashtags.length > 0 && (
            <p className="mt-1 text-sm text-accent">{data.hashtags.join(" ")}</p>
          )}
          {data.safeZoneNote && <p className="mt-3 text-xs text-muted">🛡 {data.safeZoneNote}</p>}
          {data.hwgNote && <p className="mt-1 text-xs text-muted">⚖️ {data.hwgNote}</p>}
        </div>
      </div>
    </div>
  );
}

function Zone({ style, label, vertical }: { style: React.CSSProperties; label: string; vertical?: boolean }) {
  return (
    <div className="absolute z-10 flex items-center justify-center bg-accent-3/10" style={style}>
      <span className={`text-[7px] uppercase tracking-wide text-accent-3/80 ${vertical ? "[writing-mode:vertical-rl]" : ""}`}>
        {label}
      </span>
    </div>
  );
}
