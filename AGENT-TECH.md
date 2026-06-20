# 🔧 MONA-X — How each agent works (and why it's not a GPT wrapper)

Use this for the pitch when a judge asks "but what does it *actually do*?" Each
agent below: **Input → Pipeline (how it reaches the action) → Action → What the
output is grounded in → Why it's more than a GPT wrapper.**

---

## The shared backbone (true for all 10 — say this once)

A GPT wrapper is *text in → text out*. MONA-X agents are **pipelines that end in an
action**, with engineering around the model:

- **Real ingestion, not just text.** `extract-file.ts` turns any upload into model
  input: PDF & images → Gemini **vision**; **DOCX → mammoth**; **XLSX → SheetJS**;
  CSV/TXT → text. Five formats, handled before the model sees them.
- **Grounded in real data.** The actual hospital roster, the Dr. Theiss product
  catalogue & competitor matrix, German permit formats, and platform safe-zone
  specs are embedded into the prompts — agents reason over *real* data, not vibes.
- **Structured output → product UI.** Agents return strict **JSON** (not chat),
  rendered by dedicated React components, so results are reliable and look like a
  product. Deterministic logic runs in code (VAT recompute, days-to-expiry, ±12%
  band math, candidate ranking).
- **Real integrations.** Live **Google Search** grounding, **Gmail** OAuth + REST,
  **Hugging Face** image generation.
- **Governance.** A global safety layer treats all uploaded content as untrusted
  data (injection defense), is GDPR-aware, asks for confidence; **human-in-the-loop**
  gates irreversible actions.
- **Real actions/artifacts.** Sends emails, writes PDFs/CSVs/calendar invites,
  applies & logs price changes, runs background checks.
- **Resilience & observability.** Multi-key Gemini rotation → Groq fallback;
  thinking disabled (no truncation); every run traced to **LangSmith**.

---

## 1 · LEDGER — Invoice Processing
- **Input:** an invoice as PDF / scanned image / DOCX / XLSX / CSV (DE or EN), or pulled from a connected Gmail inbox.
- **Pipeline:** upload → `extract-file` routes by type (image/PDF go to Gemini vision; DOCX via mammoth; XLSX via SheetJS; CSV decoded) → Gemini with the invoice system prompt in **JSON mode** → parsed into a typed object → `InvoiceResult` renders it.
- **Action:** opens a **pre-filled Gmail email to the correct department** (a code map turns "IT/Facilities/Procurement/…" into the right address) for human confirmation; plus CSV export and a branded PDF.
- **Grounded in:** the fields actually extracted from the document — supplier, IDs, dates, net/VAT/gross, line items. The **VAT maths is recomputed in code** (net × (1+rate) = gross) to flag mismatches.
- **Not a wrapper:** 5-format ingestion pipeline + deterministic validation + a rules-based routing decision that fires a real email action — not a paragraph of advice.

## 2 · RELAY — Shift Replacement
- **Input:** a plain-language gap (or a nurse-friendly form that composes it: dept, role, shift, certs).
- **Pipeline:** message → Gemini with the **real 100-person roster + weekly schedule embedded**, plus **6 hard eligibility rules** (same competency, required certs, status Active, off that shift, adequately rested, won't breach the weekly-hour cap) → JSON (ranked candidates, excluded with reasons, drafted SMS) → `ShiftResult` sorts by fit score and renders cards.
- **Action:** **sends the outreach SMS / Gmail** to the top pick (pre-filled), exports a contact log, generates a staffing-report PDF.
- **Grounded in:** the actual roster data (parsed from the provided XLSX into `hospital.ts`) evaluated against the explicit policy rules.
- **Not a wrapper:** it applies **deterministic eligibility filtering + ranking over real structured HR data**, then produces a sendable action — a wrapper would just chat about "consider asking nurses who are free."

## 3 · SENTINEL — Work-Permit Validation
- **Input:** a German residence/work permit (PDF or image).
- **Pipeline:** Gemini **vision** reads the document → JSON (holder, doc no., category, legal basis, valid-from/until, employment clause, confidence, criteria checks, keywords) → `PermitResult` renders a **confidence gauge + days-to-expiry countdown**.
- **Action:** **downloads a formal, stamped validation certificate** (an official-looking document, not the UI).
- **Grounded in:** the extracted permit fields + **today's date** (embedded) to compute currently-valid vs expired; an explicit criteria checklist (document type, validity, employment authorisation, field consistency).
- **Not a wrapper:** vision OCR + **date-aware validity computation** + a confidence-scored verdict + a generated certificate artifact.

## 4 · VERITAS — CV & Certificate Fraud
- **Input:** a CV or certificate (text, PDF, or image).
- **Pipeline:** text/vision → Gemini with a **per-criterion scoring rubric** → markdown with a transparent score table and 🔴 red-flags / 🟡 verify-manually / 🟢 fine tiers.
- **Action:** a recruiter **Approve / Reject** decision → an 8-second staged "processing" animation ending in an **APPROVED/REJECTED stamp**; plus a screening-report PDF.
- **Grounded in:** timeline consistency, seniority-vs-graduation plausibility, employer verifiability, certificate-issuer recognition, and AI-generation writing tells.
- **Not a wrapper:** it produces a **transparent, criterion-by-criterion risk score with how-to-verify steps** and a human decision flow — not a one-word "looks fake."

## 5 · ORACLE — Interview Support
- **Input:** a job posting (paste, PDF, or DOCX).
- **Pipeline:** JD → Gemini → a plain-English interview kit (questions, strong-vs-weak answers, red flags). A **separate `/api/quiz` endpoint** then generates MCQs from the same brief.
- **Action:** an **interactive flashcard / MCQ practice mode** (real quiz UI with scoring) so the manager rehearses; plus an interview-kit PDF.
- **Grounded in:** the parsed job posting.
- **Not a wrapper:** two-stage generation (kit + a separate interactive quiz with state and scoring) + file ingestion + a downloadable artifact — it's a tool the manager *uses*, not a chat answer.

## 6 · REELCRAFT — Marketing Reel
- **Input:** a short brief (product + angle + audience).
- **Pipeline:** brief → Gemini in JSON mode → a storyboard (hook, timed scenes, captions, hashtags) → `ReelPreview` renders it inside a **9:16 phone mock with the real TikTok vs Instagram safe-zone overlays** and an **animated playback clock**. A second model call (`/api/hf-image`) generates **real AI keyframe images** via Hugging Face FLUX.
- **Action:** **generate AI visuals** (actual images per scene), play the animated preview, open Instagram/TikTok, export the storyboard.
- **Grounded in:** embedded safe-zone margins + hero-SKU list + HWG (German ad-law) guardrails; the user's brief.
- **Not a wrapper:** it renders the plan inside **actual platform geometry**, runs a **second AI model for image generation**, and animates playback — visual media, not text.

## 7 · PULSE — Targeting Analytics
- **Input:** a targeting request (segment / product / season), optional CSV.
- **Pipeline:** **two-step** — (1) Gemini with **live Google Search grounding** fetches real current signals (this week's German weather, holidays, football fixtures); (2) a second Gemini JSON call builds the plan *using those facts* → `AnalyticsResult` renders segments, a send-window plan, and a demand chart. A "searching the web" animation plays during step 1.
- **Action:** **adds the recommended send-window to the calendar** (.ics download) + a campaign-plan PDF.
- **Grounded in:** the real product/segment data **plus live web-search results** (it cites what it found).
- **Not a wrapper:** it performs **real-time web search** and grounds timing in actual current events — a wrapper has no live data and would guess.

## 8 · TALLY — Dynamic Pricing
- **Input:** a product + current signals (e.g. "Mobil Eisspray €9.40, heatwave, match Saturday").
- **Pipeline:** Gemini JSON anchored on the **catalogue base price**, weighing signals, returning a recommended price, the **±12% guardrail band**, guardrail checks, and an audit line → `PricingResult` computes the band position and renders **before → after** with an animated slider.
- **Action:** a **mandatory human-in-the-loop approval gate** (the Apply button is **blocked if any guardrail fails**) → on approval it applies the price and **writes it to a persisted price book** (verifiable JSON record with an audit line).
- **Grounded in:** the real catalogue anchor price; the ±12% band computed in code; explicit guardrails (within band, above cost, one change/day, health-item fairness).
- **Not a wrapper:** **governed, irreversible action behind hard guardrails + human approval + a persisted, auditable state change** — this is pricing operations, not a chat suggestion.

## 9 · VANTAGE — Competitive Gap Analysis
- **Input:** an analysis request (optionally focused on a category).
- **Pipeline:** Gemini JSON using the **embedded product set + competitor matrix**, mapping both onto a **need × format grid**, ranking opportunities by size × margin × brand-fit → `GapResult` draws a **visual coverage grid** (green = covered, GAP = white-space).
- **Action:** **drafts a downloadable product-concept brief** for any opportunity (the concrete next step) + an opportunity-report PDF.
- **Grounded in:** the real Dr. Theiss catalogue and the real competitor matrix from the data pack.
- **Not a wrapper:** it builds a **structured competitive matrix from real data** and outputs an actionable artifact (a product brief), not a generic SWOT paragraph.

## 10 · AEGIS — Prompt-Injection-Resistant Secure Email
- **Input:** an applicant email + attachments (pasted, or scanned from a connected Gmail).
- **Pipeline:** the email is wrapped and passed under a **safety-layer system prompt that treats the entire body/attachments as untrusted DATA** → Gemini JSON detects injection attempts, classifies threat, and checks the required documents (CV, residence/work permit, **criminal record / Führungszeugnis**) → `SecureResult` renders a security dashboard + checklist.
- **Action:** **runs a (simulated) criminal-record database background check** (staged animation) + a compliance-report PDF.
- **Grounded in:** the required-document policy + the injection-detection logic.
- **Not a wrapper:** **a wrapper would obey the malicious instruction in the email and leak the database — that's literally how Rheinmetall got breached.** AEGIS is engineered to *refuse* embedded instructions, flag them, and continue safely. The anti-wrapper behaviour *is* the product.

---

### The one sentence to land it
> "Every agent is a pipeline — real-document ingestion, real domain data, structured
> output, deterministic checks, real integrations, and governance — that ends in an
> **action a real employee would otherwise do by hand**. A GPT wrapper gives you
> text; MONA-X gives you the email sent, the price applied, the certificate issued,
> and the attack blocked."
