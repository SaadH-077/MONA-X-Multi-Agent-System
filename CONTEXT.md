# ⚡ ACTUAL CHALLENGE (2026-06-20) — the build is now the MONA Agent Suite

The real challenge dropped: **solve as many of 10 customer feature requests as
possible** (judged on quantity + speed + accuracy), as **plausible prototypes a
non-technical customer can use**. Provider is **Gemini 2.5 Flash / Flash-lite ONLY**.
6 hours, solo. Submit 18:00.

**Status: LIVE & VERIFIED.** Real Gemini key is in `.env.local`
(`GEMINI_API_KEY`). All 10 agents tested end-to-end against the real provided
files (shift over the 100-person roster; invoice DOCX/PDF/PNG in DE+EN+USD;
permit valid→CONFIRM, expired→DENY; CV fraud; injection detection; reel JSON).

**What's built:** a unified, config-driven **MONA Agent Suite** — a hub (`/`) of 10
agent tiles, each at `/agents/<slug>` with a simple upload/paste → result UI, all
powered by Gemini via REST (`src/lib/gemini.ts`, with retry-on-overload). One
generic API route `/api/agent`. Works in demo mode with no key too.

- **Multi-format ingest** (`src/lib/extract-file.ts`): PDF/PNG/JPG → Gemini
  vision; **DOCX → mammoth**, **XLSX → SheetJS**, CSV/TXT → text. Big image scans
  are downscaled client-side. This is what makes the invoice agent handle every
  file type in the folder.
- **Agents** (`src/lib/agents.ts`, real data embedded): 1 invoice · 2 shift
  (uses real roster in `src/lib/hospital.ts`, today=20 Jun 2026, 6 eligibility
  rules) · 3 permit (today-aware expiry, ignores test watermark) · 4 cv-fraud ·
  5 interview · 6 reel (9:16 safe-zone preview, `reel-preview.tsx`) · 7 analytics ·
  8 pricing · 9 gap · 10 email-secure (prompt-injection resistant).
- **Sample files to demo with** are extracted to
  `hackathon_problems_20260620/questions/_invoices/` and `_cvs/`; permits in
  `work_permits_part_3/`; certificates in `certificates_part_4/`.
- `src/lib/hospital.ts` is AUTO-GENERATED from the xlsx (Roster + Weekly_Schedule
  merged). Regenerate logic was a one-off script (removed).
- Old recruiting pages (`/recruit`,`/chat`,`/dashboard`) still exist, off-nav.

Everything below is the earlier (pre-pivot) recruiting-starter context — still
true for those pages, but the suite above is the submission.

---

# 📍 PROJECT CONTEXT — read this first

This file is the single source of truth for what this project is and what's
already built. If you're Claude in a new session: **read this, then
`PITCH-PLAYBOOK.md`.** If you're the user: point Claude here ("read CONTEXT.md").

---

## The situation

- **Event:** MONA AI Hackathon, **20 June 2026**. (mona-ai.de/hackathon)
- **MONA AI** = German startup doing **AI recruiting/staffing automation**:
  24/7 multilingual candidate engagement, AI screening, assessments, HR agents.
  Saarbrücken-based, €2M seed (Earlybird). Pitch = **AI-assisted, human-in-the-loop**.
- **The prize:** best participants get a **Forward Deployed Engineer (FDE)** job
  offer. So judging rewards FDE skills: turn a vague business problem into a
  working, customer-facing, integrated solution — fast. Not the flashiest tech.
- **Best guess at the challenge** (prepare for, don't assume): a recruiting-ops
  tool — parse messy/multilingual CVs (PDF) → structured profile → match vs a job
  description → **human review/approve** before anything finalizes. We've
  pre-built exactly this (see `/recruit`).

## How to operate tomorrow

The moment the challenge is revealed, the user pastes it into **STEP 0 of
`PITCH-PLAYBOOK.md`**. Claude then returns the 7-part plan (restated problem →
AI pattern → MVP scope → build map → AI wiring → demo runbook → pitch script),
and we build on this starter. Speed is everything — reuse what's below.

---

## Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind v4** (config is CSS-based in `globals.css`, no tailwind.config.js)
- **React Three Fiber 9 + Drei 10 + @react-three/postprocessing** (3D + bloom)
- **Framer Motion** (animation) · **lucide-react** (icons) · **pdfjs-dist** (PDF text)
- **@anthropic-ai/sdk** — Claude. Default model `claude-opus-4-8`
  (override with `ANTHROPIC_MODEL`; `claude-sonnet-4-6` faster/cheaper,
  `claude-haiku-4-5` cheapest).
- ⚠️ This Next.js 16 has real breaking changes vs older versions. Bundled docs at
  `node_modules/next/dist/docs/`. Route handlers use Web `Request`/`Response`;
  `params` are async; `dynamic(..., { ssr:false })` must live in a client component.

## Run it

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY (optional — demo mode works without)
npm run dev                  # http://localhost:3000
npm run build                # always green; run before relying on anything
```

**Demo mode:** with no API key, every AI route returns realistic canned data, so
the whole app is demoable offline. With a key, it calls Claude for real.

## Brand palette (MONA AI, in `globals.css` CSS vars)

navy bg `#07081a` / `#0a0c24` · blue `--accent #2b7fff` · lavender `--accent-2
#c4b7f4` · coral `--accent-3 #ff8a5c`. Dark + light themes (toggle in navbar).

---

## What's built (file map)

| Route / file | What it is |
|---|---|
| `src/app/page.tsx` | Landing: hero + AI-recruiting feature cards + CTA band |
| `src/components/hero.tsx` | Hero: copy, metric chips, + big **cycling candidate "AI screening" card** over the 3D |
| `src/components/three/hero-scene.tsx` | **Interactive gradient particle wave** (blue→purple→white), ripples under cursor, bloom. (No orbiting "solar system" — that was removed.) |
| `src/app/recruit/page.tsx` | **CV PIPELINE** — 3-step stepper: ingest (paste/PDF/.txt/sample) → editable AI profile → match vs JD → human approve/reject. Export JSON. |
| `src/app/api/extract/route.ts` | CV text → structured profile JSON (Claude or demo) |
| `src/app/api/match/route.ts` | profile + JD → match score/strengths/gaps (Claude or demo) |
| `src/lib/recruit.ts` | Types, `SAMPLE_CV`/`SAMPLE_JD`, `DEMO_PROFILE`/`DEMO_MATCH`, `extractJson()` |
| `src/app/chat/page.tsx` + `src/app/api/chat/route.ts` | Streaming Claude chat (demo-mode fallback) |
| `src/app/dashboard/page.tsx` | Animated stats, bar chart, activity feed |
| `src/components/ui.tsx` | `Button` / `Card` / `Badge` primitives |
| `src/components/navbar.tsx` / `footer.tsx` | Nav (Home/Pipeline/Chat/Dashboard) + footer |
| `src/components/theme-provider.tsx` | Dark/light theme (localStorage) |

## Reusable building blocks (for whatever the challenge is)

- **Structured AI output:** copy the `/api/extract` pattern — system prompt asks
  for JSON-only, `extractJson()` parses tolerantly, demo fallback when no key.
- **Streaming AI:** `/api/chat` + `components/chat.tsx`.
- **Human-in-the-loop UI:** the `/recruit` review/approve step is the template.
- **File ingest:** `extractPdfText()` in `recruit/page.tsx` (pdf.js, CDN worker).
- **Dashboards / metrics:** `dashboard/page.tsx`.
- **3D accent:** `hero-scene.tsx`.

## Known notes / gotchas

- `THREE.Clock` deprecation warning in console = harmless three.js internal.
- PDF worker loads from jsDelivr CDN (needs internet). To go fully offline, copy
  `pdf.worker.min.mjs` into `/public` and point `GlobalWorkerOptions.workerSrc` there.
- Avatars on the hero use pravatar.cc (internet) with an initials-gradient fallback.
- Keep `ANTHROPIC_API_KEY` in `.env.local`; never commit it.

## Likely next moves tomorrow (fast wins if the guess is right)

1. Reskin copy/labels to the exact challenge wording.
2. Multi-candidate **shortlist** (rank N CVs against one JD) — extends `/recruit`.
3. Confidence flags on uncertain fields (extend the review step).
4. Voice input (browser SpeechRecognition) for the chat — multilingual demo.
5. Real structured outputs via `output_config.format` for guaranteed JSON.
