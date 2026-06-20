import { esc, mdToHtml } from "@/lib/actions";

/* Builds polished, self-contained HTML report bodies per agent from structured
   data (or markdown for the two text agents). Uses the CSS classes defined in
   printReport(): table/thead, .kv, .badge, .banner, .pill, h2, ul. */

/* eslint-disable @typescript-eslint/no-explicit-any */

const kv = (rows: [string, unknown][]) =>
  `<table class="kv"><tbody>${rows
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v ?? "—")}</td></tr>`)
    .join("")}</tbody></table>`;

const table = (head: string[], rows: unknown[][]) =>
  `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;

const bullets = (items: unknown[]) =>
  `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;

export type ReportSpec = { title: string; bodyHtml: string };

export function buildReport(slug: string, p: any, raw: string): ReportSpec {
  switch (slug) {
    case "invoice": {
      const a = p?.amounts ?? {};
      const ok = p?.status === "approve";
      return {
        title: "Invoice Processing Report",
        bodyHtml:
          `<div class="banner ${ok ? "ok" : "warn"}">${ok ? "✓ Ready to approve" : "⚠ Needs review"} · ${esc(p?.currency)} ${esc(a.gross)} · Route to ${esc(p?.department?.name)}</div>` +
          (p?.summary ? `<p>${esc(p.summary)}</p>` : "") +
          `<h2>Key details</h2>` +
          kv([
            ["Supplier", p?.supplier?.name], ["Address", p?.supplier?.address], ["VAT ID", p?.supplier?.vatId],
            ["Invoice number", p?.invoiceNumber], ["PO number", p?.poNumber],
            ["Invoice date", p?.invoiceDate], ["Due date", p?.dueDate], ["Currency", p?.currency],
            ["Net (before tax)", a.net], ["VAT", `${a.vatRate ?? ""} ${a.vatAmount ?? ""}`], ["Gross (total due)", a.gross],
          ]) +
          (p?.lineItems?.length ? `<h2>Line items</h2>` + table(["Description", "Qty", "Unit", "Total"], p.lineItems.map((l: any) => [l.description, l.qty, l.unitPrice, l.total])) : "") +
          `<h2>Department routing</h2><p><span class="pill">${esc(p?.department?.name)}</span> ${esc(p?.department?.reason)}</p>` +
          `<h2>Validation</h2>` + table(["Check", "Result", "Note"], (p?.validation?.checks ?? []).map((c: any) => [c.label, c.ok ? "✓ Pass" : "⚠ Flag", c.note])) +
          (p?.validation?.nextStep ? `<p><b>Next step:</b> ${esc(p.validation.nextStep)}</p>` : ""),
      };
    }
    case "shift":
      return {
        title: "Shift Coverage Report",
        bodyHtml:
          (p?.gap ? `<div class="banner warn">${esc(p.gap)}</div>` : "") +
          `<h2>Ranked candidates</h2>` +
          table(["#", "Name", "Dept", "Certs", "Headroom (h)", "OT", "Phone", "Fit"],
            (p?.candidates ?? []).map((c: any, i: number) => [i + 1, c.name, c.dept, c.certs, c.headroomHrs, c.overtimeOk ? "Yes" : "No", c.phone, c.score])) +
          (p?.excluded?.length ? `<h2>Excluded</h2>` + table(["Name", "Reason"], p.excluded.map((e: any) => [e.name, e.reason])) : "") +
          `<h2>Drafted outreach</h2><p><b>#1:</b> ${esc(p?.draftedMessage)}</p>${p?.backupMessage ? `<p><b>Backup:</b> ${esc(p.backupMessage)}</p>` : ""}` +
          (p?.recommendation ? `<p><b>Action:</b> ${esc(p.recommendation)}</p>` : ""),
      };
    case "analytics":
      return {
        title: "Targeting & Campaign Plan",
        bodyHtml:
          (p?.summary ? `<p>${esc(p.summary)}</p>` : "") +
          (p?.groundedOn ? `<div class="banner ok">Live signal: ${esc(p.groundedOn)}</div>` : "") +
          `<h2>Segments (RFM + affinity)</h2>` +
          table(["Segment", "SKUs", "Affinity", "Value"], (p?.segments ?? []).map((s: any) => [s.name, s.skus, s.affinity, s.value])) +
          `<h2>Targeting plan</h2>` +
          table(["Segment", "SKU", "Send window", "Why"], (p?.plan ?? []).map((x: any) => [x.segment, x.sku, x.window, x.why])) +
          (p?.measurement ? `<h2>Lift measurement</h2><p>${esc(p.measurement)}</p>` : ""),
      };
    case "pricing": {
      const ok = !!p?.withinBand;
      return {
        title: "Dynamic Price Change — Audit Record",
        bodyHtml:
          `<div class="banner ${ok ? "ok" : "bad"}">${esc(p?.product)} · ${esc(p?.currency)} ${esc(p?.basePrice)} → ${esc(p?.recommendedPrice)} (${p?.deltaPct >= 0 ? "+" : ""}${esc(p?.deltaPct)}%)</div>` +
          kv([["Product", p?.product], ["SKU", p?.sku], ["Base price", p?.basePrice], ["Recommended", p?.recommendedPrice], ["Change", `${p?.deltaPct}%`], ["Permitted band", `${p?.band?.min} – ${p?.band?.max}`], ["Within band", ok ? "Yes" : "No"]]) +
          `<h2>Signals</h2>` + table(["Signal", "Reading", "Direction", "Weight"], (p?.signals ?? []).map((s: any) => [s.signal, s.reading, s.direction, s.weight])) +
          `<h2>Guardrails</h2>` + table(["Check", "Result", "Note"], (p?.guardrails ?? []).map((g: any) => [g.label, g.ok ? "✓ Pass" : "⚠ Fail", g.note])) +
          (p?.rationale ? `<p><b>Rationale:</b> ${esc(p.rationale)}</p>` : "") +
          (p?.auditLine ? `<p style="font-family:monospace;font-size:11px;background:#f2f4fb;padding:8px;border-radius:6px">${esc(p.auditLine)}</p>` : ""),
      };
    }
    case "gap":
      return {
        title: "Competitive Gap — Opportunity Report",
        bodyHtml:
          `<h2>White-space opportunities</h2>` +
          (p?.opportunities ?? []).map((o: any, i: number) =>
            `<p><b>${i + 1}. ${esc(o.title)}</b> &nbsp;<span class="pill">fit ${esc(o.fit)}</span><span class="pill">${esc(o.difficulty)}</span><br>${esc(o.why)}<br>💡 <b>${esc(o.productIdea)}</b>${o.competitor && o.competitor !== "—" ? ` · vs ${esc(o.competitor)}` : ""}</p>`,
          ).join("") +
          (p?.quickWin ? `<div class="banner ok"><b>Quick win:</b> ${esc(p.quickWin)}</div>` : "") +
          `<h2>Coverage map (need × format)</h2>` +
          table(["Need", "Format", "Status", "Who"], (p?.grid ?? []).map((c: any) => [c.need, c.format, c.status === "have" ? "✓ covered" : c.status === "gap" ? "GAP" : "—", c.who])),
      };
    case "secure":
      return {
        title: "Secure Intake — Compliance Report",
        bodyHtml:
          `<div class="banner ${p?.injectionDetected ? "bad" : "ok"}">${p?.injectionDetected ? "⚠ Prompt-injection attempt detected & blocked" : "✓ No injection detected"} · threat: ${esc(p?.threatLevel)}</div>` +
          (p?.injectionDetected && p?.injectionQuote ? `<p><b>Blocked instruction (logged, not executed):</b><br><i>“${esc(p.injectionQuote)}”</i></p>` : "") +
          `<h2>Applicant</h2>` + kv([["Name", p?.applicant?.name], ["Role", p?.applicant?.role], ["Email", p?.applicant?.email]]) +
          `<h2>Required documents</h2>` +
          table(["Document", "Present", "Evidence"], (p?.documents ?? []).map((d: any) => [d.type, d.present ? "✓ Yes" : "✗ Missing", d.evidence])) +
          `<div class="banner ${p?.complete ? "ok" : "warn"}">${p?.complete ? "Application complete" : "Incomplete — missing: " + esc((p?.missing ?? []).join(", "))}</div>` +
          (p?.recommendation ? `<p><b>Recommended action:</b> ${esc(p.recommendation)}</p>` : ""),
      };
    case "reel":
      return {
        title: "Reel Storyboard & Shot List",
        bodyHtml:
          kv([["Product", p?.product], ["Hook", p?.hook], ["Duration", `${p?.durationSec ?? ""}s`], ["Caption", p?.caption], ["Hashtags", (p?.hashtags ?? []).join(" ")]]) +
          `<h2>Shot list</h2>` +
          table(["Time", "Visual", "On-screen text", "Voiceover"], (p?.scenes ?? []).map((s: any) => [`${s.start}–${s.end}s`, s.visual, s.onScreenText, s.vo])) +
          (p?.safeZoneNote ? `<p><b>Safe zones:</b> ${esc(p.safeZoneNote)}</p>` : "") +
          (p?.hwgNote ? `<p><b>Compliance (HWG):</b> ${esc(p.hwgNote)}</p>` : ""),
      };
    case "cv-fraud":
      return { title: "Candidate Screening Report", bodyHtml: mdToHtml(raw) };
    case "interview":
      return { title: "Interview Kit", bodyHtml: mdToHtml(raw) };
    default:
      return { title: "Agent Report", bodyHtml: mdToHtml(raw) };
  }
}
