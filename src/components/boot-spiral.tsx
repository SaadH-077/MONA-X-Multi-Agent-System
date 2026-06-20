"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AGENTS, getMeta } from "@/lib/agents";
import MonaX from "@/components/brand";

/* Startup sequence (~8s): the agents spiral out from the centre one by one,
   each lighting up as it "activates", with a progress line. Shown once per
   browser session; click to skip. */
const TOTAL_MS = 8000;

export default function BootSpiral() {
  const [show, setShow] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem("monax-booted")) return;
    setShow(true);
    sessionStorage.setItem("monax-booted", "1");

    const per = (TOTAL_MS - 1200) / AGENTS.length;
    const timers = AGENTS.map((_, i) =>
      setTimeout(() => setActive(i + 1), 400 + i * per),
    );
    const end = setTimeout(() => setShow(false), TOTAL_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(end);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] grid cursor-pointer place-items-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6 }}
          onClick={() => setShow(false)}
        >
          <div className="aurora pointer-events-none absolute inset-0 opacity-70" />
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />

          <div className="relative h-[540px] w-[540px]">
            {/* ring guide */}
            <div
              className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{ borderColor: "var(--border)" }}
            />
            {AGENTS.map((a, i) => {
              const meta = getMeta(a.slug);
              // Evenly spaced on a full circle (start at top, go clockwise).
              const angle = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
              const radius = 200;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const on = i < active;
              return (
                <motion.div
                  key={a.slug}
                  className="absolute left-1/2 top-1/2"
                  initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
                  animate={{ opacity: on ? 1 : 0.4, scale: 1, x, y }}
                  transition={{ delay: 0.3 + i * 0.12, type: "spring", stiffness: 120, damping: 14 }}
                >
                  <div className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
                    <span
                      className="grid h-12 w-12 place-items-center rounded-2xl transition-all duration-300"
                      style={{
                        backgroundColor: on ? meta.color : "var(--surface-2)",
                        color: on ? "#fff" : "var(--muted)",
                        boxShadow: on ? `0 0 26px ${meta.color}, 0 0 0 2px ${meta.color}` : "none",
                        border: on ? "none" : `1px solid var(--border)`,
                      }}
                    >
                      <a.icon className="h-6 w-6" />
                    </span>
                    <p
                      className="mt-1.5 text-[11px] font-bold tracking-[0.18em] transition-colors"
                      style={{ color: on ? meta.color : "var(--muted)" }}
                    >
                      {meta.codename}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <MonaX className="text-4xl" />
              <p className="mt-1 text-[10px] tracking-[0.3em] text-muted">
                {active < AGENTS.length ? "ACTIVATING AGENTS" : "READY"}
              </p>
            </div>
          </div>

          {/* progress */}
          <div className="absolute bottom-20 w-56">
            <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${(active / AGENTS.length) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs tracking-widest text-muted">
              {active}/{AGENTS.length} · ONE SUITE · TEN AGENTS
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
