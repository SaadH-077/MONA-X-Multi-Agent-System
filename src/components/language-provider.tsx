"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "de";

const dict = {
  en: {
    tagline: "One suite. Ten agents.",
    subtitle:
      "Ten customer requests from this morning — each built as a working agent a non-technical user can actually use. Pick one and run it.",
    openAgent: "Open an agent",
    live: "live on Gemini",
    allAgents: "All agents",
    runAgent: "Run agent",
    running: "Running agent…",
    loadSample: "Load sample",
    open: "Open",
    history: "Recent runs",
    noHistory: "No previous runs yet.",
    demoBadge: "Demo output — add GEMINI_API_KEY for live",
    typeHere: "Type or paste here…",
    builderHint: "Fill this in — we'll write the message for you 👇",
    requiredCerts: "Required certifications",
    clear: "Clear",
  },
  de: {
    tagline: "Eine Suite. Zehn Agenten.",
    subtitle:
      "Zehn Kundenanfragen von heute Morgen — jede als einsatzbereiter Agent, den auch nicht-technische Nutzer bedienen können. Wählen Sie einen aus und starten Sie ihn.",
    openAgent: "Agent öffnen",
    live: "live auf Gemini",
    allAgents: "Alle Agenten",
    runAgent: "Agent starten",
    running: "Agent läuft…",
    loadSample: "Beispiel laden",
    open: "Öffnen",
    history: "Letzte Durchläufe",
    noHistory: "Noch keine Durchläufe.",
    demoBadge: "Demo-Ausgabe — GEMINI_API_KEY für Live-Betrieb hinzufügen",
    typeHere: "Hier eingeben oder einfügen…",
    builderHint: "Einfach ausfüllen — wir formulieren die Nachricht für Sie 👇",
    requiredCerts: "Erforderliche Zertifizierungen",
    clear: "Löschen",
  },
} as const;

type Key = keyof (typeof dict)["en"];

const Ctx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
}>({ lang: "en", setLang: () => {}, t: (k) => dict.en[k] });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const s = localStorage.getItem("monax-lang") as Lang | null;
    if (s === "de" || s === "en") setLang(s);
  }, []);
  useEffect(() => {
    localStorage.setItem("monax-lang", lang);
  }, [lang]);
  const t = (k: Key) => dict[lang][k] ?? dict.en[k];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
