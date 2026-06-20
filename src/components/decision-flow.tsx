"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, FileCheck2, Mail, ShieldCheck } from "lucide-react";

/* Approve/Reject gate for the fraud agent. On decision, runs a staged ~8s
   "processing" animation (verify → notify → finalise) ending in a stamp. */

const STEPS = [
  { icon: FileCheck2, label: "Compiling candidate dossier" },
  { icon: ShieldCheck, label: "Cross-checking flags & references" },
  { icon: Mail, label: "Drafting decision email to candidate" },
  { icon: Check, label: "Finalising decision" },
];

export default function DecisionFlow() {
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!decision) return;
    setStep(0);
    setDone(false);
    const per = 1800;
    const timers = STEPS.map((_, i) => setTimeout(() => setStep(i), i * per));
    const finish = setTimeout(() => setDone(true), STEPS.length * per);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
  }, [decision]);

  if (!decision) {
    return (
      <div className="mt-5 rounded-2xl border border-border p-5">
        <p className="mb-3 text-sm font-semibold">Recruiter decision</p>
        <div className="flex gap-2">
          <button
            onClick={() => setDecision("approved")}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-2 px-4 py-2.5 text-sm font-medium text-white active:scale-95"
          >
            <Check className="h-4 w-4" /> Approve candidate
          </button>
          <button
            onClick={() => setDecision("rejected")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent-3/50 px-4 py-2.5 text-sm font-medium text-accent-3 active:scale-95"
          >
            <X className="h-4 w-4" /> Reject
          </button>
        </div>
      </div>
    );
  }

  const approved = decision === "approved";

  return (
    <div className="mt-5 rounded-2xl border border-border p-5">
      {!done ? (
        <div className="space-y-3">
          {STEPS.map((s, i) => {
            const active = i === step;
            const complete = i < step;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 text-sm transition-opacity ${
                  i <= step ? "opacity-100" : "opacity-40"
                }`}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-2">
                  {complete ? (
                    <Check className="h-4 w-4 text-accent-2" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  ) : (
                    <s.icon className="h-4 w-4 text-muted" />
                  )}
                </span>
                {s.label}
              </div>
            );
          })}
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative flex flex-col items-center py-6 text-center"
          >
            {/* Stamp */}
            <motion.div
              initial={{ scale: 2.4, opacity: 0, rotate: -18 }}
              animate={{ scale: 1, opacity: 1, rotate: -12 }}
              transition={{ type: "spring", stiffness: 220, damping: 12 }}
              className={`mb-4 rounded-xl border-4 px-6 py-3 text-2xl font-extrabold uppercase tracking-widest ${
                approved
                  ? "border-accent-2 text-accent-2"
                  : "border-accent-3 text-accent-3"
              }`}
              style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.04) inset" }}
            >
              {approved ? "Approved" : "Rejected"}
            </motion.div>
            <p className="text-sm text-muted">
              {approved
                ? "Candidate advanced — offer email drafted and dossier filed (demo)."
                : "Candidate archived — polite rejection email drafted (demo)."}
            </p>
            <button
              onClick={() => setDecision(null)}
              className="mt-4 text-xs text-accent hover:underline"
            >
              Make another decision
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
