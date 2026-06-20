"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Check, Globe, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const HeroScene = dynamic(() => import("@/components/three/hero-scene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-sm text-white/40">
      <span className="animate-pulse-dot">Initializing…</span>
    </div>
  ),
});

/* Cycling "AI screening" candidates — the live product moment on the hero. */
type Candidate = {
  name: string;
  role: string;
  location: string;
  bio: string;
  languages: string[];
  score: number;
  seed: number; // pravatar image id
};

const candidates: Candidate[] = [
  { name: "Amara Okafor", role: "Warehouse Lead", location: "Manchester, UK", bio: "7 years in high-volume fulfilment. Forklift certified, led a 12-person night shift.", languages: ["English", "Igbo"], score: 94, seed: 5 },
  { name: "Mehmet Yılmaz", role: "Logistics Driver", location: "Berlin, DE", bio: "C+E & ADR certified with 7 years on national and international routes.", languages: ["Türkçe", "Deutsch B2", "English"], score: 88, seed: 12 },
  { name: "Zofia Kowalska", role: "Care Assistant", location: "Kraków, PL", bio: "Elderly & dementia care, medication-trained, comfortable with night shifts.", languages: ["Polski", "English B1"], score: 91, seed: 32 },
  { name: "João Santos", role: "Line Cook", location: "Lisbon, PT", bio: "5 years in fast-paced kitchens. HACCP certified, calm under pressure.", languages: ["Português", "Español", "English"], score: 79, seed: 14 },
  { name: "Fatima Al-Sayed", role: "Customer Support", location: "Dubai, AE", bio: "Bilingual support agent, 96% CSAT across 3 years and 20k+ tickets.", languages: ["العربية", "English"], score: 86, seed: 45 },
  { name: "Lena Hoffmann", role: "QA Technician", location: "Munich, DE", bio: "Pharma QA with GMP experience. Detail-obsessed, audit-ready documentation.", languages: ["Deutsch", "English"], score: 90, seed: 20 },
];

function Avatar({ seed, name }: { seed: number; name: string }) {
  const [err, setErr] = useState(false);
  const initials = name.split(" ").map((n) => n[0]).join("");
  if (err) {
    return (
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-base font-semibold text-white">
        {initials}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://i.pravatar.cc/120?img=${seed}`}
      alt={name}
      onError={() => setErr(true)}
      className="h-14 w-14 shrink-0 rounded-2xl object-cover"
    />
  );
}

function ScreeningCard() {
  const [i, setI] = useState(0);
  const [count, setCount] = useState(1240);
  useEffect(() => {
    const id = setInterval(() => {
      setI((p) => (p + 1) % candidates.length);
      setCount((c) => c + Math.floor(8 + Math.random() * 12));
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const c = candidates[i];
  const status = c.score >= 85 ? "Qualified" : c.score >= 70 ? "Review" : "Hold";
  const statusColor =
    c.score >= 85 ? "text-accent-2" : c.score >= 70 ? "text-accent" : "text-accent-3";

  return (
    <div className="absolute inset-3 sm:inset-4">
      <div className="glass flex h-full flex-col rounded-2xl p-5">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent-2" />
            AI screening · live
          </div>
          <span className="text-xs text-muted">
            {count.toLocaleString()} screened today
          </span>
        </div>

        {/* cycling candidate */}
        <div className="flex flex-1 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <div className="flex items-center gap-4">
                <Avatar seed={c.seed} name={c.name} />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{c.name}</p>
                  <p className="truncate text-sm text-muted">
                    {c.role} · {c.location}
                  </p>
                </div>
                <span
                  className={cn(
                    "ml-auto shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-medium",
                    statusColor,
                  )}
                >
                  {status}
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted">{c.bio}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {c.languages.map((l) => (
                  <span key={l} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs">
                    {l}
                  </span>
                ))}
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted">AI match score</span>
                  <span className="font-semibold text-accent">{c.score}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.score}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-accent via-accent-2 to-accent-3"
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* footer */}
        <div className="flex items-center gap-1.5 text-xs text-accent-2">
          <Check className="h-3.5 w-3.5" /> Screened in {c.languages[0]} · auto-shortlisted
        </div>
      </div>
    </div>
  );
}

const chips = [
  { icon: Clock, label: "24/7 response" },
  { icon: Globe, label: "56+ languages" },
  { icon: TrendingUp, label: "85% completion" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="aurora pointer-events-none absolute inset-0" />
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto grid min-h-[90vh] max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
        {/* ---- Left: copy ---- */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6">
              <Sparkles className="h-3 w-3 text-accent" />
              AI recruiting, automated
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
          >
            Screen every candidate{" "}
            <span className="text-gradient">in seconds</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 max-w-md text-lg text-muted"
          >
            An AI agent that engages, screens, and qualifies every applicant —
            24/7, in their own language. Your recruiters only meet the best.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/recruit"
              className="glow inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white transition-transform active:scale-95"
            >
              Try the pipeline <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="glass inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-transform active:scale-95"
            >
              View dashboard
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex flex-wrap gap-2"
          >
            {chips.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-sm"
              >
                <c.icon className="h-3.5 w-3.5 text-accent" />
                {c.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* ---- Right: 3D wave + big live screening card ---- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="scene-frame h-[460px] lg:h-[600px]"
        >
          <HeroScene />
          <ScreeningCard />
        </motion.div>
      </div>
    </section>
  );
}
