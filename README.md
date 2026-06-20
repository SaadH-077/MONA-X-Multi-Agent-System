# MONA-X — One suite. Ten agents.

A unified suite of **10 AI agents**, each solving a real customer feature request
from the **MONA AI Hackathon 2026**. Every agent is a simple **paste / upload →
result** tool that a non-technical customer can actually use — no terminal, no
Postman. Built with Next.js + Gemini 2.5, bilingual (EN/DE), with a Groq fallback,
LangSmith tracing and per-agent conversation history.

> **One suite. Ten agents.**

---

## The agents

| # | Codename | Task | Customer | Input |
|---|----------|------|----------|-------|
| 1 | **LEDGER** | Invoice processing — extracts every field (net/VAT/gross), routes to the right department *with justification*, validates the maths | Globus Group | PDF · image · DOCX · XLSX · CSV |
| 2 | **RELAY** | Shift replacement — finds qualified, available, rested staff from the real roster against 6 eligibility rules and drafts the outreach. Guided form so a nurse never types from scratch | Universitätsklinikum des Saarlandes | Guided form / message |
| 3 | **SENTINEL** | Work-permit validation — confirms a genuine German permit, expiry-aware verdict (CONFIRM/DENY), shows the exact criteria it checked | Leistenschneider | PDF · image |
| 4 | **VERITAS** | CV & certificate fraud check — transparent per-criterion risk scoring, with 🔴 red flags / 🟡 verify-manually / 🟢 fine | Persowerk | PDF · image · text |
| 5 | **ORACLE** | Interview support — plain-English questions, ideal vs. red-flag answers, for a non-technical hiring manager | Kohlpharma | PDF · DOCX · text |
| 6 | **REELCRAFT** | Reel/filmmaker — a 9:16 reel plan rendered inside **TikTok & Instagram safe zones** (switchable), HWG-compliant | Dr. Theiss | text brief |
| 7 | **PULSE** | Targeting analytics — segments, behavioural patterns, best send-windows + a chart, from the real product data | Dr. Theiss | text · CSV |
| 8 | **TALLY** | Dynamic pricing — signal-driven price inside ±12% guardrails with an audit log + chart; handles unknown products gracefully | Dr. Theiss | text |
| 9 | **VANTAGE** | Product-gap analysis — need × format coverage vs. real competitors → white-space opportunities + chart | Dr. Theiss | text |
| 10 | **AEGIS** | Secure email & docs — **prompt-injection resistant**; checks required documents are present | Rheinmetall (cross-account) | text |

---

## Architecture

```
Browser (Next.js, React 19)
  └─ /agents/[slug]  → AgentRunner (upload/paste, history, charts, i18n)
        │  POST /api/agent  { slug, text, file, language }
        ▼
  Route handler (Node)
   ├─ extract-file.ts   PDF/img → Gemini vision · DOCX → mammoth · XLSX → SheetJS · CSV/TXT → text
   ├─ agents.ts         per-agent system prompts + real embedded data
   └─ gemini.ts (LLM)   Gemini 2.5 (multi-key rotation) → Groq fallback
                         + global safety layer (injection / GDPR / confidence)
                         + LangSmith tracing
```

**Key engineering decisions**
- **Multi-format ingestion** — Gemini reads PDFs/images natively; DOCX/XLSX/CSV are
  extracted server-side first, so *every* file type works (`src/lib/extract-file.ts`).
- **Reliability** — multiple Gemini keys rotate on quota/429; if all fail, **Groq**
  (free tier) serves text requests; transient 5xx are retried; output cap raised so
  tables never truncate.
- **Safety layer** — a global instruction treats all uploaded/pasted content as
  untrusted *data* (prompt-injection defense), is GDPR-aware, and asks for confidence.
- **Bilingual** — EN (default) / DE toggle; agents respond in the selected language.
- **Grounded in real data** — the hospital roster, Dr. Theiss SKU/competitor data,
  and safe-zone specs are embedded so agents reason over real inputs.
- **Per-agent history** — every run is saved locally and re-openable; all runs are
  traced to **LangSmith**.

## Tech stack
Next.js 16 · React 19 · TypeScript · Tailwind v4 · Gemini 2.5 Flash · Groq (Llama 3.3)
· LangSmith · mammoth · SheetJS · react-markdown · Framer Motion.

---

## Setup

```bash
npm install
cp .env.example .env.local   # add your keys (below)
npm run dev                  # http://localhost:3000
```

`.env.local`:

```bash
GEMINI_API_KEY=...            # primary
GEMINI_API_KEY_2=...          # optional, rotated on quota
GROQ_API_KEY=...              # optional text fallback
LANGSMITH_API_KEY=...         # optional tracing
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=mona-x
```

The provided hackathon test files (invoices, permits, CVs, certificates, hospital
schedule, Dr. Theiss data pack) are **not** committed — drop them into the relevant
agent via the upload box.

---

## Deployment

It's a single Next.js app — the frontend and the agent backend (API routes) deploy
together.

**Vercel (recommended, one click)**
1. Push to GitHub (done).
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add the env vars from above in **Project → Settings → Environment Variables**.
4. Deploy. API routes run as serverless functions automatically.

**Any Node host**
```bash
npm run build
npm run start    # serves on :3000
```
Set the same env vars in the host's environment.

---

## Notes / roadmap
- Real-time SMS for RELAY (Twilio) and a full LangGraph session store are the next
  integrations; today RELAY drafts the message and history is persisted client-side
  with LangSmith tracing on the backend.
