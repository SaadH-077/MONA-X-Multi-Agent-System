import { getAgent } from "@/lib/agents";
import { hasGeminiKey, runGemini } from "@/lib/gemini";
import { extractFile, type IncomingFile } from "@/lib/extract-file";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { slug, text, file, language } = (await req.json()) as {
    slug: string;
    text?: string;
    file?: IncomingFile | null;
    language?: "en" | "de";
  };

  const agent = getAgent(slug);
  if (!agent) {
    return Response.json({ error: "Unknown agent" }, { status: 404 });
  }

  if (!hasGeminiKey()) {
    return Response.json({ output: agent.demo, demo: true });
  }

  try {
    let inline: { data: string; mimeType: string } | null = null;
    let docText = "";
    if (file?.data) {
      const ex = await extractFile(file);
      if (ex.kind === "inline") inline = ex.file;
      else docText = ex.text;
    }

    const base = agent.buildPrompt(text ?? "", !!file);
    let prompt = docText
      ? `${base}\n\n--- Extracted content from ${file?.name ?? "the uploaded file"} ---\n${docText}`
      : base;

    // Two-step grounding: for web-search agents that also want structured JSON,
    // first fetch real-world signals (with Google Search), then feed those facts
    // into the main structured call. This keeps live search AND complete output.
    if (agent.webSearch && agent.json) {
      try {
        const facts = await runGemini({
          search: true,
          prompt: `Find current real-world signals relevant to this request (Germany, this week of ${new Date().toDateString()}): "${text ?? ""}". List 3-6 concise grounded facts — weather trend, holidays/seasonal events, football fixtures, anything timing-relevant. Max 90 words, bullet list.`,
        });
        prompt += `\n\n--- Live web-search findings (use these to ground timing) ---\n${facts}`;
      } catch {
        /* search failed — proceed without it */
      }
    }

    const output = await runGemini({
      system: agent.system,
      prompt,
      file: inline,
      json: agent.json,
      language: language === "de" ? "de" : "en",
      // Only pass search to the main call when NOT using JSON (they're incompatible).
      search: agent.webSearch && !agent.json,
    });
    return Response.json({ output, demo: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
