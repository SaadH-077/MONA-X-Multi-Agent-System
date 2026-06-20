# MONA-X — One suite. Ten agents.

A unified suite of **10 action-taking AI agents**, each solving a real customer
feature request from the **MONA AI Hackathon 2026**. Every agent is a simple
**paste / upload → result → action** tool that a non-technical customer can use —
no terminal, no Postman. Each agent doesn't just *describe* a solution, it
**takes an action**: sends an email, applies a price, downloads an official
certificate, runs a background check, generates AI video keyframes, and more.

Built with Next.js 16 + Gemini 2.5, bilingual (EN/DE), with a Groq fallback,
real Google Search grounding, Gmail integration, Hugging Face image generation,
and LangSmith tracing.

> **One suite. Ten agents.**

---

## The agents — and the action each one takes

| # | Codename | Task & customer | Output | Action it takes |
|---|----------|-----------------|--------|-----------------|
| 1 | **LEDGER** | Invoice processing · Globus Group | Full field extraction (net/VAT/gross), department routing with justification, validation | **Sends to the department for confirmation (Gmail)** + exports CSV record |
| 2 | **RELAY** | Shift replacement · Universitätsklinikum des Saarlandes | Ranked qualified/available staff (6 eligibility rules) from the real 100-nurse roster, with photos & fit scores | **Sends SMS / Gmail outreach** to the top pick + exports contact log |
| 3 | **SENTINEL** | Work-permit validation · Leistenschneider | CONFIRM/DENY verdict, confidence gauge, days-to-expiry, extracted fields, key terms | **Downloads an official validation certificate** (formal document) |
| 4 | **VERITAS** | CV & certificate fraud · Persowerk | Transparent per-criterion risk score, 🔴/🟡/🟢 tiers | **Approve/Reject** with an 8-second processing animation + stamp; downloads screening report |
| 5 | **ORACLE** | Interview support · Kohlpharma | Plain-English questions, ideal vs red-flag answers | **Interactive flashcard/MCQ practice mode** + downloads interview kit |
| 6 | **REELCRAFT** | Marketing reel · Dr. Theiss | 9:16 storyboard inside TikTok/Instagram safe zones (switchable), HWG-compliant | **Animated playback + AI-generated keyframe images** (Hugging Face FLUX); opens IG/TikTok; exports storyboard |
| 7 | **PULSE** | Targeting analytics · Dr. Theiss | RFM segments, feet/muscle affinity, send-windows, demand chart | **Real Google web search** for live timing signals; schedules the send-window (.ics); downloads campaign plan |
| 8 | **TALLY** | Dynamic pricing · Dr. Theiss | Before→after price, signals, ±12% guardrails, audit line | **Human-in-the-loop approval gate** → applies the price (written to a verifiable price book) |
| 9 | **VANTAGE** | Competitive gap · Dr. Theiss | Visual need×format coverage grid, ranked white-space opportunities | **Drafts a product concept brief** per opportunity (downloadable) |
| 10 | **AEGIS** | Secure email & docs · Rheinmetall | Prompt-injection detection, required-document checklist (CV / permit / criminal record) | **Runs a (simulated) criminal-record DB background check** with staged animation; scans real Gmail |

---

## Architecture

This is **one Next.js app**. The "frontend" (React UI) and "backend" (API route
handlers) live in the same project and deploy together — the API routes run as
serverless functions. There is no separate backend server.

```
Browser (Next.js 16 / React 19, client components)
  └─ /agents/[slug]  → AgentRunner (upload/paste, history, charts, i18n, actions)
        │  POST /api/agent   { slug, text, file, language }
        ▼
  API route handlers (Node serverless functions)
   ├─ /api/agent        generic agent runner
   ├─ /api/quiz         interview flashcards (ORACLE)
   ├─ /api/hf-image     AI keyframe generation (REELCRAFT, Hugging Face FLUX)
   ├─ /api/gmail/*      OAuth connect, list emails, fetch attachments (LEDGER, AEGIS)
   │
   ├─ lib/extract-file.ts   PDF/img → Gemini vision · DOCX → mammoth · XLSX → SheetJS · CSV/TXT → text
   ├─ lib/agents.ts         per-agent system prompts + real embedded data (roster, SKUs, competitors)
   ├─ lib/gemini.ts (LLM)   Gemini 2.5 (multi-key rotation) → Groq fallback
   │                         + Google Search grounding · safety layer · LangSmith tracing
   └─ lib/google.ts         Gmail OAuth2 + REST helpers
```

**Key engineering decisions**
- **Action-first** — each agent ends in a real action (email, file, price change,
  background check, AI media), not just a text summary.
- **Multi-format ingestion** — Gemini reads PDFs/images natively; DOCX/XLSX/CSV are
  extracted server-side first, so every file type works.
- **Structured pipelines per agent** — invoice/shift/permit/pricing/gap/secure/
  analytics return strict JSON rendered by dedicated React components (no fragile
  markdown tables, guaranteed complete render).
- **Reliability** — Gemini 2.5 Flash with thinking disabled (no truncation);
  multiple Gemini keys rotate on quota/429; Groq fallback for text; transient retries.
- **Real web search** — PULSE uses Gemini Google Search grounding via a two-step
  flow (ground real signals → build structured output).
- **Safety** — a global layer treats all uploaded/pasted content as untrusted data
  (prompt-injection defense), is GDPR-aware, and asks for confidence.
- **Bilingual** — EN (default) / DE toggle; agents respond in the selected language.
- **Grounded in real data** — hospital roster, Dr. Theiss SKU/competitor data, and
  safe-zone specs are embedded.

## Tech stack
Next.js 16 · React 19 · TypeScript · Tailwind v4 · Gemini 2.5 Flash · Groq (Llama 3.3)
· Google Search grounding · Gmail API · Hugging Face FLUX · LangSmith · mammoth ·
SheetJS · react-markdown · Framer Motion · pdfjs.

---

## Environment variables

Set these in `.env.local` for local dev, and in your host's dashboard for
production. Only `GEMINI_API_KEY` is strictly required; everything else enables a
specific feature and degrades gracefully if missing.

| Variable | Required? | What it enables | Where to get it |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | All agents (Gemini 2.5 Flash) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GEMINI_API_KEY_2` | Optional | Second key, auto-used when the first hits quota/429 | same |
| `GEMINI_MODEL` | Optional | Override model (default `gemini-2.5-flash`) | — |
| `GROQ_API_KEY` | Optional | Text fallback if all Gemini keys fail | [console.groq.com/keys](https://console.groq.com/keys) |
| `HF_TOKEN` | Optional | REELCRAFT AI keyframe images (FLUX) | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| `HF_IMAGE_MODEL` | Optional | Override image model (default `black-forest-labs/FLUX.1-schnell`) | — |
| `LANGSMITH_API_KEY` | Optional | Traces every agent run | [smith.langchain.com](https://smith.langchain.com) → Settings |
| `LANGSMITH_TRACING` | Optional | Set to `true` to enable tracing | — |
| `LANGSMITH_PROJECT` | Optional | Trace project name (e.g. `mona-x`) | — |
| `GOOGLE_CLIENT_ID` | Optional | Gmail integration (LEDGER, AEGIS) | Google Cloud Console (see below) |
| `GOOGLE_CLIENT_SECRET` | Optional | Gmail integration | Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | Optional* | OAuth callback. *Required for production* — set to `https://YOUR-DOMAIN/api/gmail/callback` | you set it |

> Secrets (`.env.local`, the Google `client_secret_*.json`) are gitignored and
> must never be committed.

---

## Run locally

```bash
npm install
cp .env.example .env.local     # fill in the variables above
npm run dev                    # http://localhost:3000
```

Works in demo mode with no keys (canned outputs). Add `GEMINI_API_KEY` to go live.
Test files (invoices, permits, CVs, certificates, roster, Dr. Theiss pack) are not
committed — upload them via each agent.

---

## Deployment (Vercel — free, one app, ~5 minutes)

Because the API routes **are** the backend, you deploy the whole thing to Vercel.
You do **not** need Render or a separate backend host.

1. **Push to GitHub** (already done): repo `MONA-X-Multi-Agent-System`.
2. Go to **[vercel.com/new](https://vercel.com/new)** → sign in with GitHub →
   **Import** the repo. Framework auto-detects as **Next.js**; leave build settings default.
3. Before the first deploy, open **Environment Variables** and add every variable
   from the table above (at minimum `GEMINI_API_KEY`). Set them for **Production**
   (and Preview if you want PR previews).
4. Click **Deploy**. You get a URL like `https://mona-x.vercel.app`.
5. **For Gmail in production**, finish the OAuth setup below, then add
   `GOOGLE_REDIRECT_URI=https://YOUR-DOMAIN/api/gmail/callback` and redeploy.

Redeploys happen automatically on every `git push` to the main branch.

### (Optional) deploy on any Node host instead
```bash
npm run build && npm run start   # serves on :3000
```
Set the same env vars in the host's environment.

---

## Gmail OAuth setup (for LEDGER & AEGIS)

1. [console.cloud.google.com](https://console.cloud.google.com) → create/select a project.
2. **APIs & Services → Library →** enable **Gmail API**.
3. **OAuth consent screen** → External → add your Google account under **Test users**.
4. **Credentials → Create credentials → OAuth client ID →**
   - **Local dev:** a *Desktop app* client works (loopback).
   - **Production:** create a **Web application** client and add the authorized
     redirect URI `https://YOUR-DOMAIN/api/gmail/callback`.
5. Put `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and (prod) `GOOGLE_REDIRECT_URI`
   in your env. Restart / redeploy → click **Connect Gmail** in LEDGER or AEGIS.

---

## Notes on honesty (for the pitch)
- **TALLY** persists applied price changes to a local price book (`localStorage`)
  — the verifiable system-of-record stand-in; production points it at a real pricing API.
- **AEGIS**'s criminal-record check is clearly **simulated** — Germany's BZR /
  Führungszeugnis has no public API for private companies; production maps to an
  authorized background-check provider.
- **REELCRAFT** generates real AI **keyframe images** (HF FLUX); text-to-video is
  not available on Hugging Face's free tier, so animated keyframe playback is the
  reliable substitute.
