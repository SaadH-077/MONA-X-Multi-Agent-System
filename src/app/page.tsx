"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { AGENTS, getMeta, localizedAgent } from "@/lib/agents";
import MonaX from "@/components/brand";
import BootSpiral from "@/components/boot-spiral";
import { useLang } from "@/components/language-provider";

export default function Home() {
  const { t, lang } = useLang();
  return (
    <div className="relative">
      <BootSpiral />
      <div className="aurora pointer-events-none absolute inset-x-0 top-0 h-[460px]" />
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[460px] opacity-40" />

      <div className="relative mx-auto max-w-6xl px-6 py-16">
        {/* Hero */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-accent" />
            MONA AI Hackathon 2026 · Gemini 2.5
          </span>

          <h1 className="mt-6">
            <MonaX className="block text-7xl leading-none sm:text-8xl" />
          </h1>
          <p className="mt-4 text-2xl font-bold tracking-tight">{t("tagline")}</p>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{t("subtitle")}</p>

          <div className="mt-7 flex items-center justify-center gap-3">
            <Link
              href="/agents/invoice"
              className="glow inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white transition-transform active:scale-95"
            >
              {t("openAgent")} <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <Zap className="h-4 w-4 text-accent-2" /> {t("live")}
            </span>
          </div>
        </div>

        {/* Agent grid */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => {
            const meta = getMeta(a.slug);
            const loc = localizedAgent(a.slug, a.title, a.blurb, a.tag, lang);
            return (
              <Link
                key={a.slug}
                href={`/agents/${a.slug}`}
                className="glass group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                style={
                  {
                    "--g": meta.color,
                  } as React.CSSProperties
                }
              >
                {/* color glow on hover */}
                <span
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-40"
                  style={{ backgroundColor: meta.color }}
                />
                <div className="relative flex items-start justify-between">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-xl transition-shadow group-hover:shadow-lg"
                    style={{
                      backgroundColor: meta.color + "22",
                      color: meta.color,
                      boxShadow: `0 0 0 1px ${meta.color}33`,
                    }}
                  >
                    <a.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold text-muted/50">
                    {String(a.n).padStart(2, "0")}
                  </span>
                </div>
                <h3
                  className="mt-4 text-lg font-bold tracking-[0.15em]"
                  style={{ color: meta.color }}
                >
                  {meta.codename}
                </h3>
                <p className="text-xs font-semibold text-foreground">{loc.title}</p>
                <p className="mt-0.5 text-xs text-accent">{a.customer}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{loc.blurb}</p>
                <span
                  className="mt-3 inline-flex items-center gap-1 text-sm opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: meta.color }}
                >
                  {t("open")} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
