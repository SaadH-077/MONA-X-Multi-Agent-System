import Anthropic from "@anthropic-ai/sdk";

/**
 * Streaming chat endpoint.
 *
 * - With ANTHROPIC_API_KEY set → streams real responses from Claude.
 * - Without a key → streams a canned demo reply so the UI works out of the box.
 *
 * The client reads a plain text stream (see components/chat.tsx). Swap the
 * provider here if the hackathon hands you a different API.
 */

// Default to the most capable model; override with ANTHROPIC_MODEL=claude-sonnet-4-6
// (cheaper/faster) or claude-haiku-4-5 if you're burning through credits.
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const { messages, system } = (await req.json()) as {
    messages: ChatMessage[];
    system?: string;
  };

  // ---- No-key demo mode: stream a canned reply word-by-word ----------------
  if (!process.env.ANTHROPIC_API_KEY) {
    const demo =
      "👋 I'm running in demo mode — no API key set yet. Drop your hackathon " +
      "ANTHROPIC_API_KEY into .env.local and restart, and I'll answer for real. " +
      "Everything else in this app (the 3D scene, the streaming UI, the dashboard) " +
      "is already wired up and ready for you to build on.";

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        for (const word of demo.split(" ")) {
          controller.enqueue(encoder.encode(word + " "));
          await new Promise((r) => setTimeout(r, 35));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // ---- Real mode: stream from Claude --------------------------------------
  const client = new Anthropic();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const claudeStream = client.messages.stream({
          model: MODEL,
          max_tokens: 4096,
          system: system ?? "You are a helpful, concise assistant for a hackathon demo.",
          messages,
        });

        claudeStream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        await claudeStream.finalMessage();
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n[Error: ${message}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
