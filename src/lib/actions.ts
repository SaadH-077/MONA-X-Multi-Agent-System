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
   dialog → the user saves it as PDF. A real, handed-over deliverable.
   The print window has NO Tailwind — all styling is the self-contained CSS
   below, so reports must use these classes (not Tailwind utilities). */
export function printReport(opts: {
  title: string;
  subtitle?: string;
  bodyHtml: string;
  accent?: string;
}) {
  const accent = opts.accent ?? "#2b7fff";
  const w = window.open("", "_blank", "width=920,height=1040");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${opts.title}</title>
  <style>
    :root{--accent:${accent}}
    *{box-sizing:border-box}
    body{font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1a1f36;margin:0;padding:0;background:#fff}
    .page{max-width:820px;margin:0 auto;padding:46px 52px}
    .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid var(--accent);padding-bottom:14px;margin-bottom:8px}
    .brand{font-weight:800;letter-spacing:.5px;font-size:14px;color:var(--accent)}
    .brand small{display:block;font-weight:600;color:#8a8fa3;letter-spacing:2px;font-size:9px;margin-top:2px}
    .ref{text-align:right;font-size:10px;color:#8a8fa3}
    h1{font-size:25px;margin:18px 0 2px;color:#1a1f36}
    .sub{color:#6b7180;margin:0 0 22px;font-size:13px}
    h2{font-size:13px;text-transform:uppercase;letter-spacing:.8px;margin:24px 0 10px;color:var(--accent);font-weight:700}
    table{width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:12.5px}
    th,td{border:1px solid #e4e7f0;padding:8px 11px;text-align:left;vertical-align:top}
    thead th{background:var(--accent);color:#fff;font-weight:600;border-color:var(--accent)}
    tbody tr:nth-child(even){background:#f7f8fc}
    .kv{width:100%;border-collapse:collapse;font-size:12.5px;margin:8px 0 14px}
    .kv th{width:34%;background:#f2f4fb;color:#4a5168;font-weight:600;border:1px solid #e4e7f0;padding:8px 11px}
    .kv td{border:1px solid #e4e7f0;padding:8px 11px}
    .badge{display:inline-block;padding:4px 13px;border-radius:99px;font-size:12px;font-weight:700;letter-spacing:.3px}
    .badge.ok{background:#e7f7ef;color:#0b7a4b;border:1.5px solid #0b7a4b}
    .badge.bad{background:#fdeaec;color:#b3261e;border:1.5px solid #b3261e}
    .banner{padding:14px 18px;border-radius:10px;margin:14px 0;font-size:14px}
    .banner.ok{background:#e7f7ef;border:1.5px solid #0b7a4b;color:#0b7a4b}
    .banner.warn{background:#fff4e5;border:1.5px solid #c77700;color:#9a5b00}
    .banner.bad{background:#fdeaec;border:1.5px solid #b3261e;color:#b3261e}
    ul{margin:6px 0 14px;padding-left:18px;font-size:12.5px} li{margin:4px 0}
    p{font-size:13px;line-height:1.55}
    .pill{display:inline-block;background:#eef1fb;color:var(--accent);border-radius:99px;padding:3px 10px;font-size:11px;margin:2px 4px 2px 0;font-weight:600}
    .foot{margin-top:40px;color:#9aa0b0;font-size:10.5px;border-top:1px solid #eee;padding-top:12px}
    @media print{.page{padding:26px 30px}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><div class="page">
    <div class="header">
      <div class="brand">MONA-X<small>AI AGENT SUITE</small></div>
      <div class="ref">${opts.subtitle ?? ""}<br>${new Date().toLocaleString()}<br>Ref MX-${Date.now().toString().slice(-8)}</div>
    </div>
    <h1>${opts.title}</h1>
    ${opts.bodyHtml}
    <div class="foot">Generated automatically by MONA-X. Agent-produced output — confirm before acting. Prototype / hackathon build.</div>
  </div></body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

/* Minimal, safe markdown → HTML for report bodies (headings, bold, bullets,
   GFM tables). Used for the text-output agents' reports. */
export function mdToHtml(md: string): string {
  const lines = md.replace(/\r/g, "").split("\n");
  let html = "";
  let i = 0;
  let inList = false;
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\*(.+?)\*/g, "<i>$1</i>");
  const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };
  while (i < lines.length) {
    const ln = lines[i];
    // table block
    if (/^\s*\|.*\|\s*$/.test(ln) && i + 1 < lines.length && /^\s*\|[-:\s|]+\|\s*$/.test(lines[i + 1])) {
      closeList();
      const head = ln.split("|").slice(1, -1).map((c) => c.trim());
      html += "<table><thead><tr>" + head.map((h) => `<th>${inline(h)}</th>`).join("") + "</tr></thead><tbody>";
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        const cells = lines[i].split("|").slice(1, -1).map((c) => c.trim());
        html += "<tr>" + cells.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>";
        i++;
      }
      html += "</tbody></table>";
      continue;
    }
    const h = ln.match(/^(#{1,3})\s+(.*)$/);
    if (h) { closeList(); html += `<h2>${inline(h[2].replace(/^[^\w(]+/, ""))}</h2>`; i++; continue; }
    if (/^\s*[-*]\s+/.test(ln)) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${inline(ln.replace(/^\s*[-*]\s+/, ""))}</li>`; i++; continue; }
    if (ln.trim() === "") { closeList(); i++; continue; }
    closeList();
    html += `<p>${inline(ln)}</p>`;
    i++;
  }
  closeList();
  return html;
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
