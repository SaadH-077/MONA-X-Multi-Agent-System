"use client";

import { useState } from "react";
import {
  Download,
  Mail,
  FileText,
  CalendarPlus,
  Video,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { getMeta } from "@/lib/agents";
import { downloadCSV, downloadICS, gmailCompose, printReport, esc } from "@/lib/actions";
import { buildReport } from "@/lib/reports";

/* The concrete ACTION(s) per agent — every agent can produce a polished PDF
   report; most have a signature action (send, connect, schedule, export). */

function deptEmail(dept?: string) {
  const d = (dept ?? "").toLowerCase();
  if (d.includes("it")) return "it@globus-group.example";
  if (d.includes("facilit") || d.includes("util")) return "facilities@globus-group.example";
  if (d.includes("procure") || d.includes("office")) return "procurement@globus-group.example";
  if (d.includes("travel")) return "travel@globus-group.example";
  if (d.includes("operation") || d.includes("finance")) return "finance@globus-group.example";
  return "finance@globus-group.example";
}

export default function ActionBar({
  slug,
  raw,
  parsed,
}: {
  slug: string;
  raw: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsed: any;
}) {
  const meta = getMeta(slug);
  const btns: { label: string; icon: LucideIcon; onClick: () => void; primary?: boolean }[] = [];

  // Universal polished PDF report (dedicated layout per agent).
  const report = () => {
    const r = buildReport(slug, parsed, raw);
    printReport({ title: r.title, subtitle: meta.codename, bodyHtml: r.bodyHtml, accent: meta.color });
  };

  // Permit gets a bespoke official certificate instead of the generic report.
  if (slug === "permit") {
    const p = parsed ?? {};
    const confirm = p.verdict === "confirm";
    btns.push({
      label: "Download validation certificate (PDF)",
      icon: FileText,
      primary: true,
      onClick: () => {
        const w = window.open("", "_blank", "width=900,height=1100");
        if (!w) return;
        const row = (k: string, v: unknown) => `<tr><th style="width:38%">${esc(k)}</th><td>${esc(v ?? "—")}</td></tr>`;
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Work Permit Validation Certificate</title>
<style>
  *{box-sizing:border-box} body{font-family:Georgia,'Times New Roman',serif;color:#14141f;margin:0;padding:54px;max-width:820px}
  .doc{border:3px double #1b2a6b;padding:36px 40px;position:relative}
  .crest{font-size:11px;letter-spacing:3px;color:#1b2a6b;text-align:center;font-family:Arial,sans-serif;font-weight:700}
  h1{font-size:22px;text-align:center;margin:6px 0 2px;color:#1b2a6b}
  .sub{text-align:center;color:#666;font-size:12px;margin:0 0 22px;font-family:Arial,sans-serif}
  table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13.5px}
  th,td{border:1px solid #c9cce0;padding:9px 12px;text-align:left;vertical-align:top}
  th{background:#eef1fb;color:#1b2a6b;font-family:Arial,sans-serif}
  .verdict{margin:18px 0;padding:14px 18px;border-radius:8px;text-align:center;font-size:18px;font-weight:700;font-family:Arial,sans-serif;
    background:${confirm ? "#e7f7ef" : "#fdeaec"};color:${confirm ? "#0b7a4b" : "#b3261e"};border:2px solid ${confirm ? "#0b7a4b" : "#b3261e"}}
  .stamp{position:absolute;right:46px;bottom:96px;transform:rotate(-14deg);border:3px solid ${confirm ? "#0b7a4b" : "#b3261e"};
    color:${confirm ? "#0b7a4b" : "#b3261e"};padding:6px 16px;border-radius:8px;font-family:Arial,sans-serif;font-weight:800;letter-spacing:2px;opacity:.85}
  .sig{display:flex;justify-content:space-between;margin-top:60px;font-size:12px;color:#444;font-family:Arial,sans-serif}
  .sig div{border-top:1px solid #999;padding-top:6px;width:42%}
  .foot{margin-top:18px;color:#999;font-size:10px;text-align:center;font-family:Arial,sans-serif}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><div class="doc">
  <div class="crest">MONA-X · SENTINEL · DOCUMENT VALIDATION AUTHORITY</div>
  <h1>Work Permit Validation Certificate</h1>
  <p class="sub">Issued ${new Date().toLocaleString()} · Ref ${esc(p.documentNo ?? "—")}-${Date.now().toString().slice(-6)}</p>
  <div class="verdict">${confirm ? "✓ VALIDATION CONFIRMED" : "✗ VALIDATION DENIED"} &nbsp;·&nbsp; Confidence ${esc(p.confidence ?? "—")}%</div>
  <table>
    ${row("Document type", p.docType)}${row("Holder", p.holder)}${row("Date of birth", p.dob)}${row("Nationality", p.nationality)}
    ${row("Document number", p.documentNo)}${row("Permit category", p.category)}${row("Legal basis", p.legalBasis)}
    ${row("Issuing authority", p.issuingAuthority)}${row("Valid from", p.validFrom)}${row("Valid until", p.validUntil)}
    ${row("Currently valid", p.isCurrentlyValid ? "Yes" : "No")}${row("Employment permitted", p.employmentPermitted ? "Yes — " + (p.employmentNote ?? "") : "No")}
  </table>
  <div class="stamp">${confirm ? "APPROVED" : "REJECTED"}</div>
  <div class="sig"><div>Automated validation · MONA-X SENTINEL</div><div>Reviewing officer (signature)</div></div>
  <div class="foot">Computer-generated validation. Verify against the original document before relying on this certificate. Test/prototype output.</div>
</div></body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 400);
      },
    });
  } else {
    // Everyone else: the dedicated polished PDF report.
    const label =
      slug === "cv-fraud" ? "Download screening report (PDF)"
      : slug === "interview" ? "Download interview kit (PDF)"
      : slug === "pricing" ? "Download price audit (PDF)"
      : slug === "gap" ? "Download opportunity report (PDF)"
      : slug === "secure" || slug === "email-secure" ? "Download compliance report (PDF)"
      : slug === "analytics" ? "Download campaign plan (PDF)"
      : slug === "reel" ? "Download storyboard (PDF)"
      : slug === "shift" ? "Download staffing report (PDF)"
      : "Download report (PDF)";
    btns.push({ label, icon: FileText, primary: true, onClick: report });
  }

  // Signature non-report actions
  if (slug === "invoice") {
    const dept = parsed?.department?.name as string | undefined;
    const a = parsed?.amounts ?? {};
    btns.push({
      label: `Send to ${dept ?? "department"} for confirmation`,
      icon: Mail,
      onClick: () =>
        gmailCompose(
          deptEmail(dept),
          `Invoice for approval — ${parsed?.supplier?.name ?? "supplier"} (${parsed?.invoiceNumber ?? ""})`,
          `Please confirm this invoice is valid for payment.\n\nSupplier: ${parsed?.supplier?.name ?? "—"}\nInvoice #: ${parsed?.invoiceNumber ?? "—"}\nNet ${a.net ?? "—"} · VAT ${a.vatAmount ?? "—"} · Gross ${a.gross ?? "—"} ${parsed?.currency ?? ""}\nRouted to: ${dept ?? "—"}\n\n— processed by MONA-X LEDGER`,
        ),
    });
    btns.push({
      label: "Export record (CSV)",
      icon: Download,
      onClick: () =>
        downloadCSV(`invoice_${parsed?.invoiceNumber ?? "record"}.csv`, [
          ["Field", "Value"], ["Supplier", parsed?.supplier?.name ?? ""], ["Invoice #", parsed?.invoiceNumber ?? ""],
          ["Net", a.net ?? ""], ["VAT", a.vatAmount ?? ""], ["Gross", a.gross ?? ""], ["Department", dept ?? ""],
        ]),
    });
  } else if (slug === "reel") {
    btns.push({ label: "Open Instagram Reels", icon: Video, onClick: () => window.open("https://www.instagram.com/", "_blank") });
    btns.push({ label: "Open TikTok Studio", icon: ExternalLink, onClick: () => window.open("https://www.tiktok.com/upload", "_blank") });
  } else if (slug === "analytics") {
    btns.push({
      label: "Add send-window to calendar",
      icon: CalendarPlus,
      onClick: () => {
        const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(18, 0, 0, 0);
        downloadICS({ title: "MONA-X — campaign send window", description: "Optimal send window recommended by PULSE.", start: d });
      },
    });
  }

  if (!btns.length) return null;

  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface-2/40 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">⚡ Take action</p>
      <div className="flex flex-wrap gap-2">
        {btns.map((b, i) => (
          <button
            key={i}
            onClick={b.onClick}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95"
            style={b.primary ? { backgroundColor: meta.color, color: "#fff" } : { border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            <b.icon className="h-4 w-4" />
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
