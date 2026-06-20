"use client";

import { useState } from "react";
import {
  Download,
  Mail,
  FileText,
  CalendarPlus,
  Tag,
  Video,
  ExternalLink,
  Check,
  type LucideIcon,
} from "lucide-react";
import { getMeta } from "@/lib/agents";
import { downloadCSV, downloadICS, gmailCompose, printReport } from "@/lib/actions";

/* Renders the concrete ACTION(s) for an agent — what it *does* with the result,
   beyond displaying text. Every agent can at least produce a PDF report;
   most have a signature action (send, connect, schedule, apply, export). */

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
  resultElementId?: string;
}) {
  const meta = getMeta(slug);
  const [applied, setApplied] = useState(false);

  // Universal: turn the on-screen rendered result into a printable PDF report.
  const downloadReport = (title: string) => {
    const el = document.getElementById("agent-result");
    const bodyHtml = el ? el.innerHTML : `<pre>${raw}</pre>`;
    printReport({ title, subtitle: meta.codename, bodyHtml, accent: meta.color });
  };

  const btns: { label: string; icon: LucideIcon; onClick: () => void; primary?: boolean }[] = [];

  switch (slug) {
    case "invoice": {
      const dept = parsed?.department?.name as string | undefined;
      const a = parsed?.amounts ?? {};
      btns.push({
        label: `Send to ${dept ?? "department"} for confirmation`,
        icon: Mail,
        primary: true,
        onClick: () =>
          gmailCompose(
            deptEmail(dept),
            `Invoice for approval — ${parsed?.supplier?.name ?? "supplier"} (${parsed?.invoiceNumber ?? ""})`,
            `Please confirm this invoice is valid for payment.\n\nSupplier: ${parsed?.supplier?.name ?? "—"}\nInvoice #: ${parsed?.invoiceNumber ?? "—"}\nDate: ${parsed?.invoiceDate ?? "—"}  Due: ${parsed?.dueDate ?? "—"}\nNet: ${a.net ?? "—"}  VAT: ${a.vatAmount ?? "—"}  Gross: ${a.gross ?? "—"} ${parsed?.currency ?? ""}\nRouted to: ${dept ?? "—"}\n\n— processed by MONA-X LEDGER`,
          ),
      });
      btns.push({
        label: "Export record (CSV)",
        icon: Download,
        onClick: () =>
          downloadCSV(`invoice_${parsed?.invoiceNumber ?? "record"}.csv`, [
            ["Field", "Value"],
            ["Supplier", parsed?.supplier?.name ?? ""],
            ["VAT ID", parsed?.supplier?.vatId ?? ""],
            ["Invoice #", parsed?.invoiceNumber ?? ""],
            ["PO #", parsed?.poNumber ?? ""],
            ["Invoice date", parsed?.invoiceDate ?? ""],
            ["Due date", parsed?.dueDate ?? ""],
            ["Currency", parsed?.currency ?? ""],
            ["Net", a.net ?? ""],
            ["VAT rate", a.vatRate ?? ""],
            ["VAT amount", a.vatAmount ?? ""],
            ["Gross", a.gross ?? ""],
            ["Department", dept ?? ""],
            ["Status", parsed?.status ?? ""],
          ]),
      });
      break;
    }
    case "shift":
      btns.push({
        label: "Export contact log (CSV)",
        icon: Download,
        onClick: () =>
          downloadCSV("shift_contact_log.csv", [
            ["Rank", "Name", "Dept", "Certs", "Headroom (h)", "OT", "Phone", "Score"],
            ...((parsed?.candidates ?? []).map((c: Record<string, unknown>, i: number) => [
              i + 1,
              c.name as string,
              (c.dept as string) ?? "",
              (c.certs as string) ?? "",
              (c.headroomHrs as number) ?? "",
              c.overtimeOk ? "Yes" : "No",
              (c.phone as string) ?? "",
              (c.score as number) ?? "",
            ])),
          ]),
      });
      break;
    case "permit":
      btns.push({
        label: "Download validation certificate (PDF)",
        icon: FileText,
        primary: true,
        onClick: () => downloadReport("Work Permit Validation Certificate"),
      });
      break;
    case "cv-fraud":
      btns.push({
        label: "Download screening report (PDF)",
        icon: FileText,
        onClick: () => downloadReport("Candidate Screening Report"),
      });
      break;
    case "interview":
      btns.push({
        label: "Download interview kit (PDF)",
        icon: FileText,
        primary: true,
        onClick: () => downloadReport("Interview Kit"),
      });
      break;
    case "reel":
      btns.push({
        label: "Open Instagram Reels",
        icon: Video,
        primary: true,
        onClick: () => window.open("https://www.instagram.com/", "_blank"),
      });
      btns.push({
        label: "Open TikTok Studio",
        icon: ExternalLink,
        onClick: () => window.open("https://www.tiktok.com/upload", "_blank"),
      });
      btns.push({
        label: "Export storyboard (CSV)",
        icon: Download,
        onClick: () =>
          downloadCSV("reel_storyboard.csv", [
            ["Start", "End", "Visual", "On-screen text", "VO"],
            ...((parsed?.scenes ?? []).map((s: Record<string, unknown>) => [
              (s.start as number) ?? "",
              (s.end as number) ?? "",
              (s.visual as string) ?? "",
              (s.onScreenText as string) ?? "",
              (s.vo as string) ?? "",
            ])),
          ]),
      });
      break;
    case "analytics":
      btns.push({
        label: "Download campaign plan (PDF)",
        icon: FileText,
        primary: true,
        onClick: () => downloadReport("Targeting & Campaign Plan"),
      });
      btns.push({
        label: "Add send-window to calendar",
        icon: CalendarPlus,
        onClick: () => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          d.setHours(18, 0, 0, 0);
          downloadICS({
            title: "MONA-X — campaign send window",
            description: "Optimal send window recommended by PULSE analytics agent.",
            start: d,
          });
        },
      });
      break;
    case "pricing":
      btns.push({
        label: applied ? "Price applied ✓" : "Apply new price",
        icon: applied ? Check : Tag,
        primary: true,
        onClick: () => {
          setApplied(true);
          try {
            const book = JSON.parse(localStorage.getItem("monax-pricebook") || "[]");
            book.unshift({ ts: Date.now(), note: raw.slice(0, 200) });
            localStorage.setItem("monax-pricebook", JSON.stringify(book.slice(0, 50)));
          } catch {}
        },
      });
      btns.push({
        label: "Export price change (PDF)",
        icon: FileText,
        onClick: () => downloadReport("Dynamic Price Change — Audit Record"),
      });
      break;
    case "gap":
      btns.push({
        label: "Download opportunity report (PDF)",
        icon: FileText,
        primary: true,
        onClick: () => downloadReport("Competitive Gap — Opportunity Report"),
      });
      break;
    case "email-secure":
      btns.push({
        label: "Download compliance report (PDF)",
        icon: FileText,
        primary: true,
        onClick: () => downloadReport("Secure Intake — Compliance Report"),
      });
      break;
    default:
      btns.push({ label: "Download report (PDF)", icon: FileText, onClick: () => downloadReport(meta.codename) });
  }

  if (!btns.length) return null;

  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface-2/40 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        ⚡ Take action
      </p>
      <div className="flex flex-wrap gap-2">
        {btns.map((b, i) => (
          <button
            key={i}
            onClick={b.onClick}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95"
            style={
              b.primary
                ? { backgroundColor: meta.color, color: "#fff" }
                : { border: "1px solid var(--border)", color: "var(--foreground)" }
            }
          >
            <b.icon className="h-4 w-4" />
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
