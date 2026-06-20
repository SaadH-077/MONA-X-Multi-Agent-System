import { hasGeminiKey, runGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You generate a short multiple-choice quiz to help a NON-TECHNICAL hiring manager practise for an interview, based on a job posting / interview brief they've just received.
Respond with ONLY valid JSON (no prose, no fences):
{
  "questions": [
    {
      "q": "the question",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explain": "one sentence on why that's correct and what a strong candidate answer sounds like"
    }
  ]
}
Make 5 questions. Mix: (1) understanding the role, (2) spotting a strong vs weak candidate answer, (3) what a key technical term means in plain English, (4) which red flag matters, (5) a good follow-up question to ask. "answer" is the 0-based index of the correct option. Keep options short and the language non-technical.`;

const DEMO = JSON.stringify({
  questions: [
    {
      q: "A candidate says they 'used an AI tool once'. For this role, what's the stronger sign?",
      options: [
        "They can name the tool",
        "They built and shipped a system end-to-end and can explain the trade-offs",
        "They have a certificate",
        "They used it recently",
      ],
      answer: 1,
      explain: "The role needs builders — 'ran a tool' ≠ 'engineered a system'; depth and trade-offs matter.",
    },
    {
      q: "What does 'takes a customer from discovery to production' mean in plain English?",
      options: [
        "They only design",
        "They go from first meeting to a working, live solution",
        "They write documentation",
        "They manage budgets",
      ],
      answer: 1,
      explain: "It means owning the whole journey, not just one slice.",
    },
  ],
});

export async function POST(req: Request) {
  const { context, language } = (await req.json()) as {
    context: string;
    language?: "en" | "de";
  };
  if (!hasGeminiKey()) return Response.json({ output: DEMO, demo: true });
  try {
    const output = await runGemini({
      system: SYSTEM,
      prompt: `Interview brief / job posting to base the quiz on:\n\n${context}`,
      json: true,
      language: language === "de" ? "de" : "en",
    });
    return Response.json({ output, demo: false });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Quiz failed" },
      { status: 500 },
    );
  }
}
