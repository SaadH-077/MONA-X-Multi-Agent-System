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
    const prompt = docText
      ? `${base}\n\n--- Extracted content from ${file?.name ?? "the uploaded file"} ---\n${docText}`
      : base;

    const output = await runGemini({
      system: agent.system,
      prompt,
      file: inline,
      json: agent.json,
      language: language === "de" ? "de" : "en",
      search: agent.webSearch,
    });
    return Response.json({ output, demo: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
