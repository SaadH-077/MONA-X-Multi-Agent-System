"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AGENTS, getMeta } from "@/lib/agents";
import MonaX from "@/components/brand";

/* Intro animation: the 10 agents spin out from the centre on a spiral,
   each showing its codename + function, then the overlay fades to the hub.
   Shown once per browser session. */
export default function BootSpiral() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("monax-booted")) return;
    setShow(true);
    sessionStorage.setItem("monax-booted", "1");
    const t = setTimeout(() => setShow(false), 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] grid cursor-pointer place-items-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          onClick={() => setShow(false)}
        >
          <div className="aurora pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative h-[520px] w-[520px]">
            {AGENTS.map((a, i) => {
              const meta = getMeta(a.slug);
              const angle = i * 0.72;
              const radius = 46 + i * 22;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <motion.div
                  key={a.slug}
                  className="absolute left-1/2 top-1/2"
                  initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1, x, y }}
                  transition={{
                    delay: 0.12 + i * 0.09,
                    type: "spring",
                    stiffness: 110,
                    damping: 14,
                  }}
                >
                  <div className="-translate-x-1/2 -translate-y-1/2 text-center">
                    <p
                      className="text-sm font-bold tracking-[0.2em]"
                      style={{ color: meta.color }}
                    >
                      {meta.codename}
                    </p>
                    <p className="text-[10px] text-muted">{a.title}</p>
                  </div>
                </motion.div>
              );
            })}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <MonaX className="text-4xl" />
            </div>
          </div>
          <motion.p
            className="absolute bottom-16 text-xs tracking-widest text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            INITIALIZING 10 AGENTS · ONE SUITE · TEN AGENTS
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
