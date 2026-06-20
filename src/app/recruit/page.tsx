"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  ScanLine,
  ShieldCheck,
  X,
  Plus,
  Check,
  Loader2,
  Upload,
  Download,
  AlertTriangle,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  SAMPLE_CV,
  SAMPLE_JD,
  type Profile,
  type MatchResult,
} from "@/lib/recruit";

type Step = 1 | 2 | 3;

/** Extract text from a PDF in the browser (pdf.js). Worker loads from a CDN
   matched to the installed version; to run fully offline, copy
   pdf.worker.min.mjs into /public and point workerSrc there instead. */
async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  let text = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((it) => (it as { str?: string }).str ?? "")
        .join(" ") + "\n";
  }
  return text.trim();
}

const steps = [
  { n: 1, label: "Ingest", icon: FileText },
  { n: 2, label: "Review", icon: ScanLine },
  { n: 3, label: "Match & approve", icon: ShieldCheck },
];

export default function RecruitPage() {
  const [step, setStep] = useState<Step>(1);
  const [cvText, setCvText] = useState("");
  const [jd, setJd] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [notes, setNotes] = useState("");
  const [parsing, setParsing] = useState(false);
  const [fileErr, setFileErr] = useState<string | null>(null);

  async function parseCv() {
    setLoading(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText }),
      });
      const data = (await res.json()) as Profile;
      setProfile(data);
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function runMatch() {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, jobDescription: jd }),
      });
      const data = (await res.json()) as MatchResult;
      setMatch(data);
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileErr(null);
    try {
      if (file.name.toLowerCase().endsWith(".pdf")) {
        setParsing(true);
        const txt = await extractPdfText(file);
        if (txt) setCvText(txt);
        else setFileErr("No text found (scanned image PDF?). Paste it manually.");
      } else {
        setCvText(await file.text());
      }
    } catch {
      setFileErr("Couldn't read that PDF — paste the text instead.");
    } finally {
      setParsing(false);
    }
  }

  function exportProfile() {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(profile.name ?? "candidate").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function patch(p: Partial<Profile>) {
    setProfile((cur) => (cur ? { ...cur, ...p } : cur));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">CV Pipeline</h1>
        <Badge>
          <ShieldCheck className="h-3 w-3 text-accent" /> Human-in-the-loop
        </Badge>
      </div>
      <p className="mb-8 text-muted">
        Messy CV → structured profile → job match. Nothing is finalized until a
        recruiter approves it.
      </p>

      {/* Stepper */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                step >= s.n
                  ? "border-accent/40 bg-accent/10 text-foreground"
                  : "border-border text-muted",
              )}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1",
                  step > s.n ? "bg-accent/50" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* ---- Step 1: Ingest ---- */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Candidate CV (any language)</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setCvText(SAMPLE_CV)}
                  className="text-xs text-accent hover:underline"
                >
                  Load sample
                </button>
                <label className="flex cursor-pointer items-center gap-1 text-xs text-muted hover:text-foreground">
                  <Upload className="h-3 w-3" /> PDF / .txt
                  <input type="file" accept=".pdf,.txt" className="hidden" onChange={onFile} />
                </label>
              </div>
            </div>
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Paste the raw CV text here, or upload a PDF / .txt…"
              className="h-48 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent"
            />
            {parsing && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <Loader2 className="h-3 w-3 animate-spin" /> Extracting text from PDF…
              </p>
            )}
            {fileErr && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-accent-3">
                <AlertTriangle className="h-3 w-3" /> {fileErr}
              </p>
            )}
          </Card>

          <Card>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Job description</label>
              <button onClick={() => setJd(SAMPLE_JD)} className="text-xs text-accent hover:underline">
                Load sample
              </button>
            </div>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the role you're matching against…"
              className="h-28 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent"
            />
          </Card>

          <Button onClick={parseCv} disabled={!cvText.trim() || loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            Parse CV with AI
          </Button>
        </motion.div>
      )}

      {/* ---- Step 2: Review (editable) ---- */}
      {step === 2 && profile && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm">
            The AI extracted this profile. <strong>Edit anything</strong> before
            it moves forward — you stay in control.
          </div>

          <Card className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" value={profile.name ?? ""} onChange={(v) => patch({ name: v })} />
              <Field label="Email" value={profile.email ?? ""} onChange={(v) => patch({ email: v })} />
              <Field label="Phone" value={profile.phone ?? ""} onChange={(v) => patch({ phone: v })} />
              <Field label="Location" value={profile.location ?? ""} onChange={(v) => patch({ location: v })} />
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-muted">Summary</p>
              <textarea
                value={profile.summary ?? ""}
                onChange={(e) => patch({ summary: e.target.value })}
                className="h-20 w-full resize-none rounded-lg border border-border bg-background p-2.5 text-sm outline-none focus:border-accent"
              />
            </div>

            <SkillsEditor
              skills={profile.skills}
              onChange={(skills) => patch({ skills })}
            />

            <div>
              <p className="mb-1 text-xs font-medium text-muted">Languages</p>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((l, i) => (
                  <span key={i} className="rounded-full bg-surface-2 px-3 py-1 text-xs">
                    {l.language} · {l.level}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted">Experience</p>
              <div className="space-y-2">
                {profile.experience.map((x, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-medium">
                      {x.title} · <span className="text-muted">{x.company}</span>
                    </p>
                    <p className="text-xs text-muted">{x.start} – {x.end}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={runMatch} disabled={!jd.trim() || loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Match against job
            </Button>
          </div>
        </motion.div>
      )}

      {/* ---- Step 3: Match & approve ---- */}
      {step === 3 && match && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">AI match score</p>
                <p className="text-4xl font-bold text-gradient">{match.score}%</p>
              </div>
              <Badge
                className={cn(
                  match.recommendation === "advance" && "border-accent-2/40 text-accent-2",
                  match.recommendation === "reject" && "border-accent-3/40 text-accent-3",
                )}
              >
                {match.recommendation}
              </Badge>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                style={{ width: `${match.score}%` }}
              />
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="mb-2 text-sm font-semibold text-accent-2">Strengths</p>
              <ul className="space-y-1.5 text-sm text-muted">
                {match.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-2" />{s}</li>
                ))}
              </ul>
            </Card>
            <Card>
              <p className="mb-2 text-sm font-semibold text-accent-3">Gaps / to verify</p>
              <ul className="space-y-1.5 text-sm text-muted">
                {match.gaps.map((g, i) => (
                  <li key={i} className="flex gap-2"><X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-3" />{g}</li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <p className="mb-1 text-sm font-semibold">AI reasoning</p>
            <p className="text-sm text-muted">{match.reasoning}</p>
          </Card>

          {/* The human gate */}
          {decision === null ? (
            <Card className="space-y-3">
              <p className="text-sm font-semibold">Recruiter decision</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note (optional)…"
                className="h-16 w-full resize-none rounded-lg border border-border bg-background p-2.5 text-sm outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <Button onClick={() => setDecision("approved")} className="flex-1">
                  <Check className="h-4 w-4" /> Approve & send to ATS
                </Button>
                <Button variant="outline" onClick={() => setDecision("rejected")}>
                  Reject
                </Button>
              </div>
            </Card>
          ) : (
            <div
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm",
                decision === "approved"
                  ? "border-accent-2/40 bg-accent-2/10"
                  : "border-accent-3/40 bg-accent-3/10",
              )}
            >
              <span className="flex-1">
                {decision === "approved"
                  ? "✅ Approved — candidate pushed to the ATS (demo)."
                  : "⛔ Rejected — candidate archived with your note (demo)."}
              </span>
              {decision === "approved" && (
                <button
                  onClick={exportProfile}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:text-accent"
                >
                  <Download className="h-3.5 w-3.5" /> Export JSON
                </button>
              )}
              <button
                onClick={() => {
                  setStep(1);
                  setProfile(null);
                  setMatch(null);
                  setDecision(null);
                  setNotes("");
                }}
                className="text-xs text-muted hover:text-foreground"
              >
                New candidate
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}

function SkillsEditor({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (s: string[]) => void;
}) {
  const [val, setVal] = useState("");
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted">Skills</p>
      <div className="flex flex-wrap items-center gap-2">
        {skills.map((s, i) => (
          <span key={`${s}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs">
            {s}
            <button onClick={() => onChange(skills.filter((_, j) => j !== i))} className="text-muted hover:text-accent-3">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="inline-flex items-center gap-1">
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              const next = val.trim();
              if (e.key === "Enter" && next && !skills.includes(next)) {
                onChange([...skills, next]);
                setVal("");
              }
            }}
            placeholder="add…"
            className="w-20 rounded-full border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-accent"
          />
          <Plus className="h-3 w-3 text-muted" />
        </div>
      </div>
    </div>
  );
}
