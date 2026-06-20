import Anthropic from "@anthropic-ai/sdk";
import { DEMO_PROFILE, extractJson, type Profile } from "@/lib/recruit";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

const SYSTEM = `You parse messy, possibly multilingual CVs/resumes into a structured candidate profile.
Respond with ONLY valid JSON (no prose, no markdown fences) matching exactly this shape:
{
  "name": string|null, "email": string|null, "phone": string|null, "location": string|null,
  "languages": [{"language": string, "level": string}],
  "summary": string|null,
  "skills": [string],
  "experience": [{"title": string, "company": string, "start": string, "end": string, "highlights": [string]}],
  "education": [{"degree": string, "institution": string, "year": string}]
}
Translate non-English field labels into English; keep proper nouns as-is. Use null or [] for anything missing. Do not invent facts.`;

export async function POST(req: Request) {
  const { cvText } = (await req.json()) as { cvText: string };

  // Demo mode: no key → return the canned parse so the pipeline still runs.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(DEMO_PROFILE);
  }

  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: cvText }],
    });
    const text = msg.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    return Response.json(extractJson<Profile>(text));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
