import Anthropic from "@anthropic-ai/sdk";
import {
  DEMO_MATCH,
  extractJson,
  type MatchResult,
  type Profile,
} from "@/lib/recruit";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

const SYSTEM = `You evaluate how well a candidate profile matches a job description for a recruiter.
Be honest and evidence-based — never invent qualifications the profile doesn't show.
Respond with ONLY valid JSON (no prose, no fences) matching exactly:
{
  "score": number (0-100),
  "recommendation": "advance" | "review" | "reject",
  "strengths": [string],
  "gaps": [string],
  "reasoning": string
}
Weight hard requirements heavily. "advance" = clearly meets the bar, "review" = borderline / needs a human look, "reject" = misses hard requirements.`;

export async function POST(req: Request) {
  const { profile, jobDescription } = (await req.json()) as {
    profile: Profile;
    jobDescription: string;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(DEMO_MATCH);
  }

  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE PROFILE (JSON):\n${JSON.stringify(
            profile,
            null,
            2,
          )}`,
        },
      ],
    });
    const text = msg.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    return Response.json(extractJson<MatchResult>(text));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Match failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
