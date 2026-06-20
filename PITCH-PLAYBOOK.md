# 🎯 MONA AI Hackathon — Operating System

This is not a doc to read end-to-end. It's a **machine**: feed the challenge in
at the top, and you (and your AI pair-programmer) get a build plan + pitch out
the bottom.

**Context that shapes everything:**
- It's an **AI hackathon** run by **MONA AI** (AI recruiting/staffing automation).
- **The prize is a Forward Deployed Engineer (FDE) job offer.** They are
  literally auditioning FDEs. So they reward the *FDE skillset*, not the flashiest
  tech: turning a vague business problem into a working, customer-facing solution,
  fast — see §1.

---

## ⚡ STEP 0 — The one move: feed the challenge to Claude

The instant you get the brief, paste this to me (your AI pair). Don't start coding first.

```
CHALLENGE: <paste the exact problem statement / brief here>
GIVEN: <APIs, datasets, credits, constraints they handed us>
TIME LEFT: <hours>
TEAM: <solo / who does what>

Use PITCH-PLAYBOOK.md. Give me the full plan.
```

### What I will hand back (hold me to this)

When you send that, I produce, in order:

1. **Problem, restated** in the customer's words + who the victim is + the cost number.
2. **AI build pattern** chosen from §3 (and why).
3. **MVP scope** — the 2–3 features we can actually finish in the time, and an
   explicit "NOT doing" list.
4. **Build map** — exactly which files in this starter to change, in what order.
5. **The AI wiring** — system prompts, structured-output schema, model choice,
   and any agent/tool loop, ready to paste.
6. **Demo runbook** — the exact click-by-click happy path to rehearse.
7. **Pitch script** — filled-in version of §5/§6 with the real numbers.

Then we build it together. That's the whole loop: **paste → plan → build → rehearse → pitch.**

---

## 1. 🧑‍💻 You're auditioning as a Forward Deployed Engineer

An FDE embeds with a customer and builds bespoke solutions *on top of the
product* to solve that customer's real problem — fast. Half engineer, half
consultant. Judges here are scoring for that. Bake these into everything:

| FDE trait | How to show it in the demo |
|-----------|----------------------------|
| **Customer obsession** | Name a real persona ("Sara, an agency recruiter") and walk *their* day. |
| **Problem → solution translation** | Open by restating their business problem better than they did. |
| **Integrate, don't reinvent** | Use the API/data/credits they gave you. Build *on* MONA, don't rebuild it. |
| **End-to-end ownership** | One thin slice that actually works start→finish beats five mockups. |
| **Business fluency** | Talk ROI: time saved, % recovered, cost cut. Money language. |
| **Handles the real world** | Show the messy case — bad input, another language, an edge case — handled gracefully. |
| **Ships under pressure** | A working, rehearsed demo *is* the proof you can do the job. |

> The winning mindset: "If MONA dropped me at this customer Monday morning, this
> is what I'd build by Friday." Build *that*.

---

## 2. ⏱️ First 30 minutes (don't open the editor yet)

1. **Problem in one sentence**, customer's words: *"An agency loses 6 of 10 applicants because nobody replies for 2 days."*
2. **Name the victim** — who feels this daily (recruiter, candidate, ops lead, CEO).
3. **Quantify the pain** — time / money / %. Guess if you must; a number beats a vibe.
4. **Write the "after" sentence** — the world once you've solved it.
5. **Pick ONE demo moment** — the single screen where the magic is obvious.
6. **Then** run STEP 0 and pick the build pattern (§3).

If you can't fill in 1–5, you don't understand the problem yet. Ask a mentor/judge.

---

## 3. 🧭 AI build-pattern decision table

Match the brief to a pattern, then build it on this starter. Default model is
`claude-opus-4-8`; drop to `claude-sonnet-4-6` for speed/cost during iteration,
`claude-haiku-4-5` for cheap high-volume classification.

| Signal words in the brief | AI pattern | Build on this starter | "Wow" moment |
|---|---|---|---|
| "assistant", "chatbot", "answer questions", "copilot" | **Conversational assistant** | Tune `system` prompt in `chat/page.tsx` | Natural, instant, multilingual reply |
| "do tasks for me", "automate steps", "take actions" | **Agent w/ tool use** | Add a tool loop around `api/chat/route.ts` | AI calls a tool live and acts |
| "answer from these docs", "knowledge base", "policy" | **RAG / grounded Q&A** | Stuff retrieved text into the system prompt | Cites the exact source line |
| "extract", "parse", "fill the form", "from this CV" | **Structured extraction** | Ask Claude for JSON, render as fields | Messy CV → clean structured profile |
| "score", "rank", "classify", "match", "shortlist" | **Scoring / matching** | JSON score + reason → dashboard list | Candidate list auto-ranked with *why* |
| "insights", "where do we lose people", "monitor" | **Analytics + AI narrative** | Feed data to `dashboard/page.tsx` + AI summary | Dashboard explains itself in plain English |
| "in their language", "voice", "screenshot", "image" | **Multimodal** | System prompt + browser speech / image input | Switches language / reads an image live |

**Unsure? The default winning shape:** a chat-driven assistant for the persona +
a dashboard that shows the *outcome metric* you improve. Two screens, one story.

---

## 4. 🔧 AI implementation cheats (on THIS starter)

You already have streaming chat, an interactive 3D hero, a dashboard, theming
(now in MONA's navy/blue/lavender/coral palette).

- **Single AI call / chat** → it's wired. Just change the `system` prop on `<Chat>`.
- **Structured output (JSON)** → in the system prompt, say: *"Respond ONLY with
  JSON matching {schema}."* Parse it in the route and render a scorecard/profile.
  (For hard guarantees, ask Claude to use `output_config.format` — I'll wire it.)
- **Agent / tool use** → I'll add a tool-call loop in `api/chat/route.ts` so Claude
  can call a function (lookup, book, score) and use the result.
- **RAG** → keyword/embedding match over the provided docs, then inject the top
  chunks into the system prompt. Cite them in the answer.
- **Streaming UI** → already done — it's a huge perceived-quality win, keep it visible.
- **Multilingual** → Claude is natively multilingual; just prompt it. Great fit
  for MONA's domain — show it switching languages live.
- **Reliability (FDE points)** → handle empty input, show a confidence/score, and
  have a graceful fallback. Don't let the demo crash on an edge case.

Model switch: set `ANTHROPIC_MODEL` in `.env.local`. Keep the key in `.env.local`,
never commit it.

---

## 5. 🧱 The pitch structure (memorize — ~3 min)

**Problem → Agitate → Solution → Demo → Impact → Ask.**

| Beat | Time | What you say |
|---|---|---|
| Hook / Problem | 20s | The one-sentence pain. Make a judge nod. |
| Agitate | 20s | Why it's expensive / getting worse. The number. |
| Solution | 25s | One line: "X does Y so Z." |
| **Demo** | 90s | *Show, don't tell.* Walk the one magic moment live. |
| Impact | 20s | The "after" metric, tied to the agitate number. |
| Ask / Vision | 15s | What's next + thank you. |

**The demo is 50%+ of your time.** Judges remember what they *saw working*.

---

## 6. ✍️ Rapid story framework (fill in live, 5 min)

```
PROBLEM:    [Who] struggles to [do what] because [why it's hard today].
COST:       This costs them [time / money / % ] every [period].
SOLUTION:   [Name] is a [category] that [core action] so [outcome].
HOW:        The user [opens / clicks / says X] and [the product does Y instantly].
PROOF:      In the demo you'll see [the one magic moment].
IMPACT:     We turn [bad number] into [good number].
WHY NOW:    [Why AI makes this possible now / why on MONA's platform].
```

**Worked example:** PROBLEM: *Staffing agencies can't reply to applicants fast
enough* — COST: *they lose ~60% to faster competitors weekly* — SOLUTION: *Mona
contacts & screens every applicant in seconds, 24/7* — HOW: *applicant applies →
within seconds Mona messages them in their language, asks 3 screening questions,
books the interview* — IMPACT: *40% → 85% completion* — WHY NOW: *LLMs can now
hold a natural multilingual screening conversation.*

---

## 7. 🎬 Demo UX checklist — "how the user interacts"

- [ ] **One clear entry point** — a single button/input starts the journey.
- [ ] **Show the trigger** — type/click it on screen, don't describe it.
- [ ] **Show the AI working** — streaming text, a node lighting up. Visible latency feels intentional.
- [ ] **Show the payoff** — result lands in a clean UI: a card, score, filled form, a number ticking up.
- [ ] **Narrate as the user** — "Now Sara sees her top 3 candidates," not "this calls /screen."
- [ ] **Happy-path script** — exact clicks + words, rehearsed 3×. Never improvise.
- [ ] **Pre-load demo data** — hardcode the perfect example.
- [ ] **Fallback** — a screen-recording of it working, in case wifi/API dies.

---

## 8. 💼 Pre-built MONA-domain scenarios (pitch-ready)

MONA AI = AI recruiting/staffing automation (24/7 multilingual candidate
engagement, screening, assessment, HR agents). The brief will *probably* orbit one.

1. **Speed-to-lead** — Applicants go cold in hours; AI replies in seconds, books the interview. *40% → 85% completion; 2 days → 9 seconds.*
2. **Multilingual onboarding** — AI converses + explains contracts in the candidate's native language. *Unlock the 30% of applicants you couldn't serve.*
3. **Recruiter copilot** — AI handles FAQs/scheduling/pre-screen; recruiter sees a clean shortlist. *Save 200 min/applicant; 65% cost cut.*
4. **Structured, bias-aware screening** — Every candidate gets the same scored, explainable, auditable interview. *EU-AI-Act / GDPR aligned.*
5. **Drop-off rescue** — Dashboard finds the funnel bottleneck; AI auto-nudges stalled candidates. *Recover X% of "lost" candidates, zero recruiter effort.*
6. **Skills assessment** — AI runs + grades a 60-second role-specific check in chat. *Time-to-shortlist: days → minutes.*

---

## 9. 🏆 Scorecard, anti-patterns, pre-demo

**What judges (FDE-hiring) score:**

| Criterion | How to win it |
|---|---|
| Business value | Lead with the number. Money/time saved. |
| Working demo | Runs live. Polished > feature-rich. Rehearse. |
| FDE instinct | Real customer, real workflow, integrated, end-to-end. |
| Innovation | One genuinely clever twist — not a thin wrapper. |
| Technical execution | Clean, fast, no crashes. Hardcode what isn't the point. |
| Presentation | Confident, plain language, on time. |
| Fit to brief | Solve *their* problem, not the one you wish they asked. |

**🚫 Instant credibility killers:**
- Architecture slides before anything runs. · Typing long inputs live. · "If we
  had more time…" laundry lists. · Explaining code instead of the user's journey.
- No before/after number. · 5 half-features over 2 polished ones. · No offline fallback.

**📋 Run 10 min before pitching:**
- [ ] `npm run dev` up; happy path works end-to-end.
- [ ] `ANTHROPIC_API_KEY` set (or demo mode intentional).
- [ ] Demo data pre-loaded; inputs ready to paste.
- [ ] Browser zoomed for the back row.
- [ ] Backup screen-recording saved.
- [ ] Opening sentence + closing number memorized.

---

*Paste the challenge into STEP 0. Then we build. Go win the offer.*
