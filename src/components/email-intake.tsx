"use client";

import { useEffect, useState } from "react";
import { Mail, Paperclip, ChevronDown, Loader2, RefreshCw } from "lucide-react";

/* Gmail inbox for the invoice agent. If Gmail is connected (real OAuth), shows
   real emails with invoice attachments — clicking one fetches the attachment
   and processes it. If not configured/connected, offers Connect + a demo inbox
   fallback so the agent always works. */

type GmailAttachment = { filename: string; mimeType: string; attachmentId: string };
type GmailEmail = {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  attachments: GmailAttachment[];
};

type DemoEmail = { from: string; subject: string; attachment: string; body: string };

const DEMO: DemoEmail[] = [
  {
    from: "billing@stadtwerke-muenchen.de",
    subject: "Ihre Gasrechnung Juni 2026",
    attachment: "rechnung_gas_2026.pdf",
    body: `RECHNUNG Nr. GAS-2026-004871
Stadtwerke München GmbH · USt-IdNr: DE129273398
Rechnungsdatum: 03.06.2026  Fällig: 17.06.2026
Erdgas Grundpreis 1 Monat 12,90 €; Arbeitspreis 2.430 kWh × 0,0812 € = 197,32 €; CO2-Abgabe 23,81 €; Messstellenbetrieb 7,50 €
Netto 241,53 €  MwSt 7% 16,91 €  Gesamt 258,44 €`,
  },
  {
    from: "accounts@microsoft.com",
    subject: "Microsoft 365 — Invoice",
    attachment: "microsoft_licenses.pdf",
    body: `INVOICE MS-EU-2026-55821 · Microsoft Ireland · VAT IE8256796U
Date 01.06.2026  Due 30.06.2026
50 × Microsoft 365 E3 @ €36.00 = €1,800.00
Net €1,957.26  VAT 23% €450.17  Total €2,407.43`,
  },
];

export default function EmailIntake({
  onText,
  onFile,
}: {
  onText: (body: string) => void;
  onFile: (f: { data: string; mimeType: string; name: string }) => void;
}) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [emails, setEmails] = useState<GmailEmail[]>([]);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/gmail/messages");
      const d = await r.json();
      setConnected(!!d.connected);
      setConfigured(d.configured !== false);
      setEmails(d.emails ?? []);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function pickReal(email: GmailEmail, att: GmailAttachment) {
    setFetchingId(email.id + att.attachmentId);
    try {
      const r = await fetch("/api/gmail/attachment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: email.id, attachmentId: att.attachmentId }),
      });
      const d = await r.json();
      if (d.data) onFile({ data: d.data, mimeType: att.mimeType, name: att.filename });
    } finally {
      setFetchingId(null);
    }
  }

  return (
    <div className="mb-3 rounded-xl border border-border bg-surface-2/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium"
      >
        <Mail className="h-4 w-4 text-accent" />
        {connected ? "Gmail inbox — invoices" : "Inbox — supplier invoices"}
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] ${
            connected ? "bg-accent-2/15 text-accent-2" : "bg-accent/15 text-accent"
          }`}
        >
          {connected ? "● live Gmail" : "demo inbox"}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-border">
          {/* Connect / status bar */}
          <div className="flex items-center justify-between gap-2 px-4 py-2 text-xs">
            {connected ? (
              <button onClick={refresh} className="inline-flex items-center gap-1 text-muted hover:text-foreground">
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            ) : (
              <a
                href="/api/gmail/auth"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 font-medium text-white"
              >
                <Mail className="h-3.5 w-3.5" /> Connect Gmail
              </a>
            )}
            {!configured && (
              <span className="text-muted">Set GOOGLE_CLIENT_ID/SECRET to enable live Gmail</span>
            )}
          </div>

          {/* Real emails */}
          {connected &&
            emails.map((e) => (
              <div key={e.id} className="border-t border-border/60 px-4 py-3">
                <p className="truncate text-sm font-medium">{e.subject}</p>
                <p className="truncate text-xs text-muted">{e.from}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {e.attachments.map((a) => (
                    <button
                      key={a.attachmentId}
                      onClick={() => pickReal(e, a)}
                      disabled={fetchingId === e.id + a.attachmentId}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-accent hover:border-accent disabled:opacity-50"
                    >
                      {fetchingId === e.id + a.attachmentId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Paperclip className="h-3 w-3" />
                      )}
                      {a.filename}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          {connected && emails.length === 0 && !loading && (
            <p className="border-t border-border/60 px-4 py-3 text-xs text-muted">
              No emails with invoice attachments found in this inbox.
            </p>
          )}

          {/* Demo fallback */}
          {!connected &&
            DEMO.map((e, i) => (
              <button
                key={i}
                onClick={() => onText(e.body)}
                className="flex w-full items-start gap-3 border-t border-border/60 px-4 py-3 text-left hover:bg-surface-2"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                  {e.from[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.subject}</p>
                  <p className="truncate text-xs text-muted">{e.from}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-accent">
                    <Paperclip className="h-3 w-3" /> {e.attachment}
                  </p>
                </div>
                <span className="shrink-0 self-center text-xs text-accent">Process →</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
