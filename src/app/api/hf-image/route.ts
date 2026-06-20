export const runtime = "nodejs";
export const maxDuration = 60; // Vercel free (Hobby) tier caps at 60s

const MODEL = process.env.HF_IMAGE_MODEL ?? "black-forest-labs/FLUX.1-schnell";

/* Generates an AI keyframe image (base64) from a scene description via the
   Hugging Face router. Used by the reel agent to render real visuals. */
export async function POST(req: Request) {
  const token = process.env.HF_TOKEN;
  if (!token) return Response.json({ error: "HF_TOKEN not set" }, { status: 503 });

  const { prompt } = (await req.json()) as { prompt: string };
  const styled = `${prompt}. Vertical 9:16 social media reel frame, cinematic studio lighting, high detail, product marketing aesthetic, no text overlay.`;

  try {
    const res = await fetch(
      `https://router.huggingface.co/hf-inference/models/${MODEL}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: styled }),
      },
    );
    if (!res.ok) {
      const t = await res.text();
      return Response.json({ error: `HF ${res.status}: ${t.slice(0, 140)}` }, { status: 502 });
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") || "image/jpeg";
    return Response.json({ dataUrl: `data:${mime};base64,${buf.toString("base64")}` });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "image generation failed" },
      { status: 500 },
    );
  }
}
