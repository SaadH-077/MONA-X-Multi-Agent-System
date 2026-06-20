"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/* Guided builder so a nurse never has to write a message from scratch — they
   pick from dropdowns and the request is composed automatically. */

const DEPTS = [
  "ICU",
  "Emergency",
  "Cardiology",
  "Maternity",
  "Oncology",
  "Pediatrics",
  "Surgery",
  "General Medicine",
];
const ROLES = ["Registered Nurse", "Charge Nurse", "Certified Nursing Assistant"];
const SHIFTS = [
  { label: "Tonight · Night", v: "tonight's NIGHT shift (Sat 06/20, 19:00–07:00)" },
  { label: "Tomorrow · Day", v: "tomorrow's DAY shift (Sun 06/21, 07:00–19:00)" },
  { label: "Tomorrow · Night", v: "tomorrow's NIGHT shift (Sun 06/21, 19:00–07:00)" },
];
const CERTS = ["BLS", "ACLS", "PALS", "NRP", "OCN"];

export default function ShiftBuilder({
  onCompose,
}: {
  onCompose: (msg: string) => void;
}) {
  const [dept, setDept] = useState("ICU");
  const [role, setRole] = useState("Registered Nurse");
  const [shift, setShift] = useState(SHIFTS[0].v);
  const [certs, setCerts] = useState<string[]>(["BLS", "ACLS"]);
  const [who, setWho] = useState("");

  useEffect(() => {
    const certStr = certs.length ? ` The shift needs ${certs.join(" + ")}.` : "";
    const whoStr = who.trim() ? `${who.trim()} called in sick, so ` : "";
    onCompose(
      `${whoStr}I need a ${role} to cover the ${dept} ${shift}.${certStr} Who can cover?`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept, role, shift, certs, who]);

  return (
    <div className="mb-3 rounded-xl border border-border bg-surface-2/50 p-4">
      <p className="mb-3 text-xs font-medium text-muted">
        Fill this in — we&apos;ll write the message for you 👇
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Department">
          <Select value={dept} onChange={setDept} options={DEPTS} />
        </Field>
        <Field label="Role needed">
          <Select value={role} onChange={setRole} options={ROLES} />
        </Field>
        <Field label="Which shift?">
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none focus:border-accent"
          >
            {SHIFTS.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Who called in sick? (optional)">
          <input
            value={who}
            onChange={(e) => setWho(e.target.value)}
            placeholder="e.g. Felix Haddad"
            className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
        </Field>
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-xs font-medium text-muted">
          Required certifications
        </p>
        <div className="flex flex-wrap gap-2">
          {CERTS.map((c) => {
            const on = certs.includes(c);
            return (
              <button
                key={c}
                onClick={() =>
                  setCerts((cur) =>
                    on ? cur.filter((x) => x !== c) : [...cur, c],
                  )
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  on
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted">{label}</p>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none focus:border-accent"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
