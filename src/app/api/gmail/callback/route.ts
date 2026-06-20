import { exchangeCode } from "@/lib/google";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

  try {
    const tokens = await exchangeCode(code);
    // Store tokens in httpOnly cookies; redirect back to the invoice agent.
    const headers = new Headers();
    headers.append("Location", "/agents/invoice?gmail=connected");
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    headers.append(
      "Set-Cookie",
      `g_access=${tokens.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3000${secure}`,
    );
    if (tokens.refresh_token) {
      headers.append(
        "Set-Cookie",
        `g_refresh=${tokens.refresh_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`,
      );
    }
    return new Response(null, { status: 302, headers });
  } catch (e) {
    return new Response(`OAuth error: ${e instanceof Error ? e.message : e}`, { status: 500 });
  }
}
