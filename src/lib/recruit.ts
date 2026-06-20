/* Types, sample data, and demo-mode fallbacks for the CV → profile → match
   → human-review pipeline. Everything here works with NO API key so the demo
   runs offline; with a key, the API routes produce real AI output instead. */

export type Language = { language: string; level: string };
export type Experience = {
  title: string;
  company: string;
  start: string;
  end: string;
  highlights: string[];
};
export type Education = { degree: string; institution: string; year: string };

export type Profile = {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  languages: Language[];
  summary: string | null;
  skills: string[];
  experience: Experience[];
  education: Education[];
};

export type MatchResult = {
  score: number; // 0-100
  recommendation: "advance" | "review" | "reject";
  strengths: string[];
  gaps: string[];
  reasoning: string;
};

/** Tolerant JSON extraction — strips ``` fences / prose around the object. */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in model output");
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

/* ---- Sample inputs (the "messy, multilingual CV" + a job description) ---- */

export const SAMPLE_CV = `Lebenslauf — MEHMET YILMAZ
geboren 1991 · Istanbul/Berlin · mehmet.yilmaz91@gmail.com · +49 152 0000000

PROFIL
Zuverlässiger Berufskraftfahrer (C+E) mit 7 Jahren Erfahrung in Logistik &
Lagerlogistik. Suche Festanstellung im Raum Berlin.

SPRACHEN: Türkçe (Muttersprache), Deutsch (B2), English (B1)

ERFAHRUNG
2019–heute  LKW-Fahrer, Schenker Deutschland AG
  - Nationale & internationale Touren, Gefahrgut (ADR)
  - Be- und Entladung, Tourenplanung
2016-2019   Lagerist @ Otto Group, Hamburg
  - Kommissionierung, Staplerschein, Inventur

AUSBILDUNG
2015  Führerschein Klasse C+E + ADR-Schein
2009  Lise diploması (High School), Istanbul

SKILLS: Gabelstapler, ADR/Gefahrgut, Tourenplanung, SAP (Grundkenntnisse)`;

export const SAMPLE_JD = `Job: Logistics Driver (C+E) — Berlin
We need a reliable driver with a valid C+E licence and ADR (hazardous goods)
certification. 3+ years driving experience. German B1+ required for depot
communication; additional languages a plus. Forklift licence preferred.
Must be comfortable with national and international routes.`;

/* ---- Demo-mode outputs (used when ANTHROPIC_API_KEY is not set) ---- */

export const DEMO_PROFILE: Profile = {
  name: "Mehmet Yılmaz",
  email: "mehmet.yilmaz91@gmail.com",
  phone: "+49 152 0000000",
  location: "Berlin / Istanbul",
  languages: [
    { language: "Turkish", level: "Native" },
    { language: "German", level: "B2" },
    { language: "English", level: "B1" },
  ],
  summary:
    "Reliable C+E professional driver with 7 years in logistics and warehousing, seeking a permanent role around Berlin.",
  skills: ["C+E licence", "ADR / hazardous goods", "Forklift", "Route planning", "SAP (basic)"],
  experience: [
    {
      title: "Truck Driver",
      company: "Schenker Deutschland AG",
      start: "2019",
      end: "present",
      highlights: ["National & international routes", "ADR hazardous goods", "Loading/unloading, route planning"],
    },
    {
      title: "Warehouse Operative",
      company: "Otto Group, Hamburg",
      start: "2016",
      end: "2019",
      highlights: ["Order picking", "Forklift certified", "Stock-taking"],
    },
  ],
  education: [
    { degree: "C+E licence + ADR certificate", institution: "—", year: "2015" },
    { degree: "High School Diploma", institution: "Istanbul", year: "2009" },
  ],
};

export const DEMO_MATCH: MatchResult = {
  score: 88,
  recommendation: "advance",
  strengths: [
    "Valid C+E licence and ADR certification — both hard requirements met",
    "7 years driving experience (well above the 3+ needed)",
    "German B2 exceeds the B1 depot-communication requirement",
    "Forklift licence (preferred) present",
  ],
  gaps: [
    "Phone number appears to be a placeholder — verify before contacting",
    "No explicit mention of recent international-route activity gaps",
  ],
  reasoning:
    "Candidate meets every hard requirement (C+E, ADR, 3+ years, German B1+) and several preferred ones. Recommend advancing to a phone screen after verifying contact details.",
};
