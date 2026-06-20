# 🎤 MONA-X — 5-Minute Pitch & Architecture Breakdown

> **Tagline:** *One suite. Ten agents. Ten customer problems — solved with action, not chat.*

---

## PART 1 — The 5-minute pitch (say this)

### 0:00 — The hook (30s)
> "This morning, ten different MONA customers each sent in a hard, real problem —
> from invoice chaos at Globus to last-minute night-shift gaps at the
> Universitätsklinikum, to Rheinmetall getting their applicant database leaked by
> a prompt injection.
>
> We didn't build ten demos. We built **MONA-X — one suite of ten AI agents**, and
> every single one **takes a real action**: it sends the email, applies the price,
> downloads the official certificate, runs the background check. Not a chatbot that
> *describes* a solution — an agent that *does* it."

### 0:30 — Why this wins (30s)
> "Three principles. **One:** built for the customer, not the coder — every agent is
> upload-or-type → result → **action**, no terminal, no Postman. **Two:** grounded in
> *their* real data — the actual hospital roster, the real Dr. Theiss product
> catalogue, real German work permits. **Three:** production-grade plumbing —
> bilingual EN/DE, prompt-injection defense, human-in-the-loop guardrails, live web
> search, and full observability."

### 1:00 — Live demo (3 min) — show **4 agents**, ~45s each
Pick the four with the strongest *action* (script in Part 3):
1. **LEDGER** (invoice) — drop a German PDF → extracted, routed, **"Send to Facilities for confirmation"** opens a real email.
2. **RELAY** (shift) — fill the form → ranks the real roster → **sends the SMS** to cover the shift.
3. **AEGIS** (secure email) — paste the injected email → it **catches the attack**, checks the documents, **runs the background check**.
4. **TALLY** (pricing) — signals in → before→after price → **human approves** → price applied & logged.

> Closing each: *"…and that's the action. It didn't tell me what to do — it did it."*

### 4:00 — Close (1 min)
> "Ten customer problems. Ten working agents. One suite. Each one ends in an
> action that makes a real employee's job disappear — invoices route themselves,
> shifts fill themselves, fraud gets flagged, prices move within guardrails, and a
> prompt-injection attack gets stopped cold.
>
> It's bilingual, it's grounded in real data, it's traced end-to-end, and it's
> deployed. **That's MONA-X — the impossible, by end of day.**"

---

## PART 2 — Architecture (how to explain it)

### The one-liner
> "It's **one Next.js app**. The UI and the agent backend are the same deployment —
> the API routes run as serverless functions. One generic agent endpoint, a smart
> LLM layer, and a dedicated result renderer per agent."

### The flow (draw this if asked)
```
   Customer (browser, EN/DE)
        │  upload / type  → /agents/<name>
        ▼
   AgentRunner (React)  ──POST /api/agent {slug,text,file,language}──►  Route handler
                                                                          │
   ┌──────────────────────────────────────────────────────────────────────┘
   │  1. extract-file.ts   PDF/img → Gemini vision · DOCX→mammoth · XLSX→SheetJS · CSV→text
   │  2. agents.ts         per-agent system prompt + embedded real data
   │  3. gemini.ts (LLM)   Gemini 2.5 Flash  ──quota?──►  2nd key  ──fail?──►  Groq
   │                        + Google Search grounding (PULSE)
   │                        + safety layer (injection / GDPR / confidence)
   │                        + LangSmith tracing
   └──►  structured JSON  ──►  dedicated React renderer  ──►  ACTION (email/PDF/price/check)
```

### The 5 architectural pillars (name-drop these)
1. **One generic agent runner, ten configs.** Every agent is a config object in
   `agents.ts` (system prompt + embedded data + input mode + output kind). Adding an
   agent = adding a config. That's how we shipped ten in a day.
2. **Structured output → dedicated renderers.** The document/data agents return
   strict **JSON**, rendered by purpose-built React components (not raw chat text).
   That's why results never truncate and always look like a product.
3. **Resilient LLM layer.** Gemini 2.5 Flash with thinking disabled (no truncation),
   **multi-key rotation** on quota, **Groq fallback**, transient retries. The demo
   doesn't die if a key hits its limit.
4. **Real grounding & real actions.** Live **Google Search** (PULSE), real **Gmail**
   ingestion (LEDGER/AEGIS), real **AI image generation** (REELCRAFT/Hugging Face),
   real file downloads, calendar invites, price-book writes.
5. **Trust by design.** A global safety layer treats all uploaded content as
   untrusted data (prompt-injection defense), is GDPR-aware, asks for confidence;
   **human-in-the-loop** gates the irreversible actions (pricing approval).

### Tech stack (one breath)
Next.js 16 · React 19 · TypeScript · Tailwind v4 · **Gemini 2.5 Flash** · Groq
fallback · Google Search grounding · Gmail API · Hugging Face FLUX · **LangSmith**
tracing · mammoth (DOCX) · SheetJS (XLSX) · deployed on **Vercel**.

---

## PART 3 — Per-agent breakdown (the detail, if a judge digs in)

For each: **the problem → what it does → the architecture → the ACTION → the wow line.**

### 1 · LEDGER — Invoice Processing (Globus Group)
- **Problem:** finance team buried in supplier invoices, sorting & data entry by hand.
- **Does:** reads an invoice in any format/language, extracts every field, routes to the right department with justification, validates the VAT maths.
- **Architecture:** multi-format ingestion (PDF/PNG → Gemini vision; DOCX → mammoth; XLSX → SheetJS; CSV → text) → JSON → invoice renderer. Optional **real Gmail** inbox to pull invoices from email.
- **ACTION:** **"Send to {Department} for confirmation"** (opens a pre-filled email) + CSV export + PDF report.
- **Wow:** "It read a grey-photocopy German gas bill, recomputed the 7% VAT, routed it to Facilities, and emailed it for sign-off."

### 2 · RELAY — Shift Replacement (Universitätsklinikum des Saarlandes)
- **Problem:** fill last-minute night-shift gaps when staff call in sick, within hours.
- **Does:** reasons over the **real 100-nurse roster** against 6 hard eligibility rules (competency, certs, active, off that day, rested, weekly-hour cap), ranks by fit, drafts outreach.
- **Architecture:** real roster + schedule embedded (parsed from the provided xlsx) → JSON → ranked candidate cards with photos & fit scores. Nurse-friendly **guided form** so they never type.
- **ACTION:** **Send SMS / Gmail** to the top pick (pre-filled) + contact-log CSV + PDF report.
- **Wow:** "A nurse fills three dropdowns and the agent finds the one rested, ICU-certified, under-cap nurse out of a hundred and texts them — in seconds."

### 3 · SENTINEL — Work-Permit Validation (Leistenschneider)
- **Problem:** validating candidate work permits by hand — slow, error-prone, scaling.
- **Does:** confirms it's a genuine German residence/work title, extracts holder/category/legal-basis, computes **days-to-expiry vs today**, gives a confidence %, CONFIRM/DENY.
- **Architecture:** Gemini vision → JSON → renderer with a **confidence gauge**, expiry countdown, key-term extraction, criteria checklist.
- **ACTION:** **Downloads an official validation certificate** — a formal, stamped document.
- **Wow:** "Valid permit → confirmed with 417 days left; expired one → denied, expired 02.05.2024. And it hands you an official certificate."

### 4 · VERITAS — CV & Certificate Fraud (Persowerk)
- **Problem:** a wave of AI-generated CVs and fake certificates.
- **Does:** transparent **per-criterion** fraud-risk scoring (authenticity, timeline, plausibility, employer verifiability, certificate validity) with 🔴/🟡/🟢 tiers and how to verify each.
- **Architecture:** text/vision → markdown analysis (CV *or* certificate).
- **ACTION:** **Approve / Reject** with an 8-second processing animation ending in an **APPROVED/REJECTED stamp** + screening-report PDF.
- **Wow:** "It doesn't just say 'suspicious' — it shows the score breakdown, tells you exactly what to verify, and stamps the decision."

### 5 · ORACLE — Interview Support (Kohlpharma)
- **Problem:** a non-technical manager posted a technical role and doesn't know what to ask.
- **Does:** plain-English questions, what a strong vs weak answer sounds like, red flags to watch, a 3-question phone screen.
- **Architecture:** job posting (paste / PDF / DOCX) → markdown kit.
- **ACTION:** **interactive flashcard/MCQ practice mode** (the manager rehearses) + interview-kit PDF.
- **Wow:** "It turns a JD the manager doesn't understand into an interview script — then quizzes *them* so they walk in ready."

### 6 · REELCRAFT — Marketing Reel (Dr. Theiss)
- **Problem:** studio-quality short-form reels that respect TikTok/Instagram safe zones.
- **Does:** a tailored 9:16 storyboard (hook, scenes, captions, hashtags) matched to the product & angle, HWG-compliant (no medical claims).
- **Architecture:** JSON storyboard → a **9:16 phone mock** with the real TikTok vs Instagram safe-zone overlays (switchable tabs), **animated playback**, and **real AI-generated keyframe images** (Hugging Face FLUX).
- **ACTION:** **Generate AI visuals** (real images per scene) + animated preview + open Instagram/TikTok + storyboard export.
- **Wow:** "It writes the reel, renders it inside the actual safe zones, and generates the keyframes with AI — you can press play."

### 7 · PULSE — Targeting Analytics (Dr. Theiss)
- **Problem:** ingest customer data, find patterns, deliver ads at the optimal time, measure lift.
- **Does:** RFM segments, feet-vs-muscle affinity, season-of-purchase, the best **segment × SKU × send-window**, and a treatment-vs-control lift plan.
- **Architecture:** **real Google Search** (two-step grounding: fetch live weather/holidays/fixtures → build structured plan) → JSON → renderer with a demand chart.
- **ACTION:** **Add the send-window to the calendar** (.ics) + campaign-plan PDF. Shows a "searching the web" animation.
- **Wow:** "It actually searched the web, found this week's heatwave and a football fixture, and timed the cooling-spray campaign around them."

### 8 · TALLY — Dynamic Pricing (Dr. Theiss)
- **Problem:** adjust prices on external signals (weather, events, sport, supply) — safely.
- **Does:** anchors on the catalogue price, weighs signals, recommends a price inside a **±12% guardrail band**, logs an audit line.
- **Architecture:** JSON → renderer with **before→after** price, an animated band slider, signals table, guardrail checklist.
- **ACTION:** **Human-in-the-loop approval gate** (blocked if a guardrail fails) → applies the price → writes it to a **verifiable price book** with the JSON record.
- **Wow:** "No price moves without a human. Approve, and it applies the change and logs it — auditable, guard-railed, done."

### 9 · VANTAGE — Competitive Gap Analysis (Dr. Theiss)
- **Problem:** find the white-space competitors fill and the brand doesn't.
- **Does:** maps products vs competitors on a **need × format grid**, surfaces the gaps, ranks opportunities by size × margin × brand-fit.
- **Architecture:** real product set + competitor matrix embedded → JSON → a **visual coverage grid** (green = covered, GAP = white-space).
- **ACTION:** **Drafts a product concept brief** for any opportunity (downloadable) + opportunity-report PDF.
- **Wow:** "It shows the gap visually — Allpresan owns urea-foam, we don't — and drafts the product brief to go fill it."

### 10 · AEGIS — Prompt-Injection-Resistant Email (Rheinmetall)
- **Problem:** applicant emails leaked their database via a prompt injection; need secure processing + a document-completeness check.
- **Does:** treats the entire email as untrusted **data**, detects & blocks injection attempts, checks the required documents are present (CV, residence/work permit, **criminal record / Führungszeugnis**).
- **Architecture:** safety-layer prompt → JSON → security dashboard (threat banner, document checklist). Real **Gmail** scanning.
- **ACTION:** **Runs a (simulated) criminal-record database background check** with a staged animation + compliance-report PDF.
- **Wow:** "Paste the exact attack that leaked their database — it catches it, refuses it, checks the documents, and runs the background check. The attack goes nowhere."

---

## PART 4 — Honesty notes (if pressed — answer confidently)
- **TALLY** writes applied prices to a local price book — the verifiable system-of-record stand-in; production points it at a real pricing API. *The guardrails and human approval are real.*
- **AEGIS** background check is **clearly simulated** — Germany's criminal-record registry (BZR/Führungszeugnis) has **no public API** for private companies; production maps to an authorized background-check provider. *Honest by design.*
- **REELCRAFT** generates real AI **keyframe images** (text-to-video isn't on Hugging Face's free tier) — animated keyframe playback is the reliable substitute.

---

## PART 5 — Demo logistics
- **Run:** `npm run dev` → open `http://localhost:3000` (Gmail agents work best on localhost).
- **LAN access for judges:** they open `http://192.168.1.77:3000` (your `ipconfig` IPv4). *If they can't connect, allow **Node.js** through **Windows Defender Firewall** (Private networks) — accept the prompt on first run.*
- **Downloads/PDFs** work over LAN HTTP (client-side). If a PDF window doesn't open, allow pop-ups for the site.
- **Order to demo:** LEDGER → RELAY → AEGIS → TALLY (then mention the other six on the hub).
