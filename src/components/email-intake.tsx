"use client";

import { useState } from "react";
import { Mail, Paperclip, ChevronDown } from "lucide-react";

/* Mock inbox for the invoice agent — tells the "agent takes invoices from an
   email" story. Clicking an email loads its invoice into the agent input.
   In production this panel is fed by the Gmail API / IMAP (see README). */

type Email = { from: string; subject: string; attachment: string; body: string };

const EMAILS: Email[] = [
  {
    from: "billing@stadtwerke-muenchen.de",
    subject: "Ihre Gasrechnung Juni 2026",
    attachment: "rechnung_gas_2026.pdf",
    body: `RECHNUNG Nr. GAS-2026-004871
Stadtwerke München GmbH · USt-IdNr: DE129273398
Rechnungsdatum: 03.06.2026  Fällig: 17.06.2026
Pos 1: Erdgas Grundpreis  1 Monat  12,90 €
Pos 2: Erdgas Arbeitspreis  2.430 kWh × 0,0812 €  197,32 €
Pos 3: CO2-Abgabe (BEHG)  23,81 €
Pos 4: Messstellenbetrieb  7,50 €
Netto 241,53 €  MwSt 7% 16,91 €  Gesamt 258,44 €`,
  },
  {
    from: "accounts@microsoft.com",
    subject: "Microsoft 365 — Invoice",
    attachment: "microsoft_licenses.pdf",
    body: `INVOICE MS-EU-2026-55821
Microsoft Ireland Operations Ltd · VAT: IE8256796U
Date: 01.06.2026  Due: 30.06.2026
50 × Microsoft 365 E3 licenses @ €36.00 = €1,800.00
Net €1,957.26  VAT 23% €450.17  Total €2,407.43`,
  },
  {
    from: "no-reply@hotel-adlon.de",
    subject: "Rechnung Ihres Aufenthalts",
    attachment: "hotel_adlon.docx",
    body: `RECHNUNG · Hotel Adlon Kempinski Berlin · USt-IdNr: DE811234567
Datum: 10.06.2026
3 Übernachtungen × 480,00 € = 1.440,00 €
Frühstück 3 × 35,00 € = 105,00 €
Netto 1.518,83 €  MwSt 7% 106,82 €  Gesamt 1.625,65 €`,
  },
];

export default function EmailIntake({ onPick }: { onPick: (body: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3 rounded-xl border border-border bg-surface-2/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium"
      >
        <Mail className="h-4 w-4 text-accent" />
        Inbox — supplier invoices ({EMAILS.length})
        <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent">
          demo inbox
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-border">
          {EMAILS.map((e, i) => (
            <button
              key={i}
              onClick={() => onPick(e.body)}
              className="flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left last:border-0 hover:bg-surface-2"
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
          <p className="px-4 py-2 text-[11px] text-muted">
            Production: this list is fed by the Gmail API / IMAP watcher on a
            shared inbox — see README.
          </p>
        </div>
      )}
    </div>
  );
}
