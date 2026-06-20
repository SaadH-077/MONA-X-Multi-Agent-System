"use client";

/* Client-side ACTION helpers — these are what make each agent *do something*
   (produce a file, open a channel, change state) rather than just print text. */

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  downloadFile(filename, rows.map((r) => r.map(esc).join(",")).join("\n"), "text/csv;charset=utf-8");
}

/* Opens a styled, printable report in a new window and triggers the print
   dialog → the user saves it as PDF. A real, handed-over deliverable. */
export function printReport(opts: {
  title: string;
  subtitle?: string;
  bodyHtml: string;
  accent?: string;
}) {
  const accent = opts.accent ?? "#2b7fff";
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${opts.title}</title>
  <style>
    *{box-sizing:border-box} body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#14141f;margin:0;padding:48px;max-width:800px}
    .brand{font-weight:800;letter-spacing:-.5px;font-size:13px;color:${accent}}
    h1{font-size:26px;margin:6px 0 2px} .sub{color:#666;margin:0 0 24px;font-size:13px}
    h2{font-size:15px;margin:22px 0 8px;border-bottom:2px solid ${accent};padding-bottom:4px;display:inline-block}
    table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}
    th,td{border:1px solid #e2e2ee;padding:7px 10px;text-align:left;vertical-align:top}
    th{background:#f4f6fb}
    .kv{display:grid;grid-template-columns:200px 1fr;gap:4px 16px;font-size:13px;margin:6px 0}
    .kv div:nth-child(odd){color:#666}
    .badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600}
    ul{margin:6px 0;padding-left:18px;font-size:13px} li{margin:3px 0}
    .foot{margin-top:36px;color:#999;font-size:11px;border-top:1px solid #eee;padding-top:10px}
    @media print{body{padding:24px}}
  </style></head><body>
    <div class="brand">MONA-X · AI Agent Suite</div>
    <h1>${opts.title}</h1>
    <p class="sub">${opts.subtitle ?? ""} · Generated ${new Date().toLocaleString()}</p>
    ${opts.bodyHtml}
    <div class="foot">Generated automatically by MONA-X. Figures and routing are agent-produced; confirm before action.</div>
  </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 350);
}

/* Calendar invite (.ics) for a send-window / shift / reminder. */
export function downloadICS(opts: { title: string; description?: string; start: Date; durationMin?: number }) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const end = new Date(opts.start.getTime() + (opts.durationMin ?? 60) * 60000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MONA-X//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@mona-x`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(opts.start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${opts.title}`,
    `DESCRIPTION:${(opts.description ?? "").replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  downloadFile(`${opts.title.replace(/\s+/g, "_")}.ics`, ics, "text/calendar");
}

export function gmailCompose(to: string, subject: string, body: string) {
  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
  window.open(url, "_blank");
}

export const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
