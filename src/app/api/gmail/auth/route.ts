import { authUrl, googleConfigured } from "@/lib/google";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!googleConfigured()) {
    return new Response(
      "Gmail not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local (see src/lib/google.ts for the 2-minute setup).",
      { status: 503 },
    );
  }
  return Response.redirect(authUrl(req));
}
