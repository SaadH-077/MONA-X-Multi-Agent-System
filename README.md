<div align="center">

# MONA-X — One suite. Ten agents.

**A suite of 10 action-taking AI agents that each turn a real customer request into a _completed action_** — send the email, apply the price, run the check, generate the media. Not a chatbot, not a demo of prompts: ten focused tools a non-technical user can actually run.

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-mona--x.vercel.app-2b7fff?style=for-the-badge&logo=vercel&logoColor=white)](https://mona-x-multi-agent-system.vercel.app)
&nbsp;
[![5-min Pitch](https://img.shields.io/badge/📖_5--min_Pitch-PITCH.md-c4b7f4?style=for-the-badge)](./PITCH.md)

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232a?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-8e75f8?style=flat-square&logo=googlegemini&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel)

> Built **solo in 6 hours** as part of the **MONA GmbH AI Hackathon 2026**.

<img src="public/screenshots/00-hub.png" alt="MONA-X agent hub — all ten agents" width="900" />

</div>

---

## Why this project

The brief was a **forward-deployed engineering** problem in disguise: a customer arrives with **ten different, vaguely-specified business requests** (invoices, staffing, permits, fraud, pricing, marketing, …) and you have a few hours to ship something they can actually use.

Instead of one clever model demo, I built **a productized suite**: a single hub, ten purpose-built agents, each ending in a **real action** with a **human-in-the-loop** where it matters. Every agent works **end-to-end in the browser** — paste or upload → structured result → an action that leaves the app (an email, a PDF, a price write, a calendar invite, a background check).

**What it demonstrates**
- Turning vague business problems into a working, **customer-facing** product fast.
- Real **integrations** (Gmail OAuth, Google Search grounding, image generation) — not just prompt-and-print.
- **Production deployment** on Vercel with graceful degradation (works in demo mode with no keys).
- Judgment about **safety, trust, and honesty**: prompt-injection defense, approval gates, and clearly-labelled simulations where a real API isn't publicly available.

---

## The ten agents — and the action each one takes

| # | Codename | Task & customer | Action it takes |
|---|----------|-----------------|-----------------|
| 1 | **LEDGER** | Invoice processing · Globus Group | Extracts every field (net/VAT/gross), routes to the right department → **sends it for confirmation via Gmail** + CSV export |
| 2 | **RELAY** | Shift replacement · Universitätsklinikum des Saarlandes | Ranks qualified/available staff from the 100-nurse roster (6 rules) → **sends SMS/Gmail outreach** to the top pick |
| 3 | **SENTINEL** | Work-permit validation · Leistenschneider | CONFIRM/DENY verdict + confidence + days-to-expiry → **downloads an official validation certificate** |
| 4 | **VERITAS** | CV & certificate fraud · Persowerk | Transparent per-criterion risk score → **Approve/Reject** with stamped screening report |
| 5 | **ORACLE** | Interview support · Kohlpharma | Plain-English questions + ideal/red-flag answers → **interactive flashcard/MCQ practice** + interview kit |
| 6 | **REELCRAFT** | Marketing reel · Dr. Theiss | 9:16 storyboard inside TikTok/Instagram safe zones → **AI-generated keyframe images** (HF FLUX) + animated playback |
| 7 | **PULSE** | Targeting analytics · Dr. Theiss | RFM segments + demand chart + send-windows → **real Google web search** for timing + **.ics** calendar invite |
| 8 | **TALLY** | Dynamic pricing · Dr. Theiss | Before→after price within ±12% guardrails → **human-in-the-loop approval** → writes to a verifiable price book |
| 9 | **VANTAGE** | Competitive gap · Dr. Theiss | Visual need×format coverage grid → **drafts a product-concept brief** per white-space opportunity |
| 10 | **AEGIS** | Secure email & docs · Rheinmetall | Detects prompt injection + required-doc checklist → **runs a (simulated) criminal-record background check** |

---

## See them work

<table>
<tr>
<td width="50%"><b>PULSE</b> — targeting analytics: live web-search signal, demand chart, RFM segments, send-windows, and a calendar action.<br/><img src="public/screenshots/07-analytics-result.png" width="100%" /></td>
<td width="50%"><b>TALLY</b> — dynamic pricing: before→after price, guardrail checks, and a <i>human approval gate</i> before anything is applied.<br/><img src="public/screenshots/08-pricing-result.png" width="100%" /></td>
</tr>
<tr>
<td width="50%"><b>RELAY</b> — shift replacement: ranked staff with fit scores, ready-to-send Gmail/SMS messages, and a staffing PDF.<br/><img src="public/screenshots/02-shift-result.png" width="100%" /></td>
<td width="50%"><b>AEGIS</b> — secure intake: prompt-injection <i>detected &amp; blocked</i>, required-document checklist, and a background-check action.<br/><img src="public/screenshots/10-email-secure-result.png" width="100%" /></td>
</tr>
<tr>
<td width="50%"><b>VANTAGE</b> — competitive gap: a visual need×format coverage grid and ranked white-space opportunities.<br/><img src="public/screenshots/09-gap-result.png" width="100%" /></td>
<td width="50%"><b>LEDGER</b> — invoice intake: connect a real Gmail inbox or use the demo inbox, then process any PDF/image/DOCX/XLSX.<br/><img src="public/screenshots/01-invoice.png" width="100%" /></td>
</tr>
</table>

---

## Architecture

This is **one Next.js app**. The React UI and the API route handlers live in the same project and deploy together — the routes run as serverless functions on Vercel. There is no separate backend server.

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
   └─ lib/google.ts         Gmail OAuth2 + REST helpers (redirect URI derived from request host)
```

**Key engineering decisions**
- **Action-first** — each agent ends in a real action (email, file, price change, background check, AI media), not just a text summary.
- **Structured pipelines per agent** — invoice/shift/permit/pricing/gap/secure/analytics return strict JSON rendered by dedicated React components, so output is complete and never a broken markdown table.
- **Polished PDF deliverables** — every agent generates a branded, print-ready report (`src/lib/reports.ts`); SENTINEL produces a formal stamped certificate.
- **Multi-format ingestion** — Gemini reads PDFs/images natively; DOCX/XLSX/CSV are extracted server-side first, so every file type works.
- **Reliability** — Gemini 2.5 Flash with thinking disabled (no truncation); multiple Gemini keys rotate on quota/429; Groq fallback for text; transient retries.
- **Real web search** — PULSE uses Gemini's Google Search grounding via a two-step flow (ground real signals → build structured output).
- **Safety** — a global layer treats all uploaded/pasted content as untrusted data (prompt-injection defense), is GDPR-aware, and reports confidence.
- **Bilingual** — EN (default) / DE toggle; agents respond in the selected language.
- **Graceful degradation** — runs in demo mode with canned outputs and no API keys; every optional integration degrades cleanly if its key is missing.

### Tech stack
Next.js 16 · React 19 · TypeScript · Tailwind v4 · Gemini 2.5 Flash · Groq (Llama 3.3) · Google Search grounding · Gmail API · Hugging Face FLUX · LangSmith · mammoth · SheetJS · react-markdown · Framer Motion · pdf.js

---

## Run locally

```bash
npm install
cp .env.example .env.local     # fill in the variables below
npm run dev                    # http://localhost:3000
```

Works in **demo mode** with no keys (canned outputs). Add `GEMINI_API_KEY` to go live. Test files (invoices, permits, CVs, certificates, roster, Dr. Theiss pack) are not committed — upload them via each agent, or click **Load sample** on the text agents.

### Environment variables

Set these in `.env.local` for local dev, and in your host's dashboard for production. Only `GEMINI_API_KEY` is strictly required; everything else enables a specific feature and degrades gracefully if missing.

| Variable | Required? | What it enables | Where to get it |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | All agents (Gemini 2.5 Flash) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GEMINI_API_KEY_2` | Optional | Second key, auto-used when the first hits quota/429 | same |
| `GEMINI_MODEL` | Optional | Override model (default `gemini-2.5-flash`) | — |
| `GROQ_API_KEY` | Optional | Text fallback if all Gemini keys fail | [console.groq.com/keys](https://console.groq.com/keys) |
| `HF_TOKEN` | Optional | REELCRAFT AI keyframe images (FLUX) | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| `LANGSMITH_API_KEY` / `LANGSMITH_TRACING` / `LANGSMITH_PROJECT` | Optional | Traces every agent run | [smith.langchain.com](https://smith.langchain.com) |
| `GOOGLE_CLIENT_ID` | Optional | Gmail integration (LEDGER, AEGIS) | Google Cloud Console (see below) |
| `GOOGLE_CLIENT_SECRET` | Optional | Gmail integration | Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | **Leave unset** | Escape hatch only. The callback URL is derived automatically from the request host, so the same build works on localhost and in production. | — |

> Secrets (`.env.local`, the Google `client_secret_*.json`) are gitignored and must never be committed.

---

## Deployment (Vercel)

The API routes **are** the backend, so the whole app deploys to Vercel as one project — no separate backend host.

1. **[vercel.com/new](https://vercel.com/new)** → import the repo. Framework auto-detects as **Next.js**; leave build settings default.
2. Add the environment variables above (at minimum `GEMINI_API_KEY`) for **Production**.
3. **Deploy.** Redeploys happen automatically on every push to `main`.

---

## Gmail OAuth setup (for LEDGER & AEGIS)

The callback URL is **derived from the request host**, so you don't set a redirect URI in env — you just register the right URLs in Google.

1. [console.cloud.google.com](https://console.cloud.google.com) → create/select a project.
2. **APIs & Services → Library** → enable **Gmail API**.
3. **OAuth consent screen** → External → add your Google account under **Test users**.
4. **Credentials → Create credentials → OAuth client ID → Web application.** Under **Authorised redirect URIs**, add **both** (full path matters — not the bare domain):
   - `http://localhost:3000/api/gmail/callback`
   - `https://YOUR-PROD-DOMAIN/api/gmail/callback`  *(e.g. `https://mona-x-multi-agent-system.vercel.app/api/gmail/callback`)*
5. Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your env (local **and** Vercel). **Do not** set `GOOGLE_REDIRECT_URI` on Vercel.
6. Restart / redeploy → click **Connect Gmail** in LEDGER or AEGIS.

> **`Error 400: redirect_uri_mismatch`?** The exact callback URL the app sends (`https://YOUR-DOMAIN/api/gmail/callback`) must be listed verbatim under *Authorised redirect URIs* — including the `/api/gmail/callback` path. The most common mistake is registering only the bare domain. Also make sure `GOOGLE_REDIRECT_URI` is **not** set to a localhost value in production.

---

## Notes on honesty (for the pitch)
- **TALLY** persists applied price changes to a local price book (`localStorage`) — the verifiable system-of-record stand-in; production points it at a real pricing API.
- **AEGIS**'s criminal-record check is clearly **simulated** — Germany's BZR / Führungszeugnis has no public API for private companies; production maps to an authorized background-check provider.
- **REELCRAFT** generates real AI **keyframe images** (HF FLUX); text-to-video is not on Hugging Face's free tier, so animated keyframe playback is the reliable substitute.

---

<div align="center">
Built solo by <b><a href="https://github.com/SaadH-077">Saad Haroon Jehangir</a></b> · MONA GmbH AI Hackathon 2026
</div>
