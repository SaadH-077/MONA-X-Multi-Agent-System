/* Minimal Google OAuth2 + Gmail REST helpers (no SDK). Used by Agent 1 to fetch
   real supplier invoices from a connected Gmail inbox.

   SETUP (2 min, one-time):
   1. console.cloud.google.com → create a project → APIs & Services → Enable "Gmail API".
   2. OAuth consent screen → External → add your Google account as a Test user.
   3. Credentials → Create OAuth client ID → Web application. Add BOTH authorised
      redirect URIs (one per environment you use):
        http://localhost:3000/api/gmail/callback
        https://YOUR-PROD-DOMAIN/api/gmail/callback
   4. Put the client id/secret in .env.local:
        GOOGLE_CLIENT_ID=...
        GOOGLE_CLIENT_SECRET=...

   The redirect URI is derived automatically from the incoming request's host, so
   the same code works on localhost and in production with NO extra env var. Only
   set GOOGLE_REDIRECT_URI if you need to force a specific callback URL (escape hatch).
*/

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

// Trim env values — pasted secrets/URLs often carry trailing spaces/newlines,
// which silently break OAuth (redirect_uri_mismatch).
const clientId = () => (process.env.GOOGLE_CLIENT_ID ?? "").trim();
const clientSecret = () => (process.env.GOOGLE_CLIENT_SECRET ?? "").trim();

export function googleConfigured() {
  return !!clientId() && !!clientSecret();
}

/* Resolve the OAuth callback URL.
   - If GOOGLE_REDIRECT_URI is set, it wins (escape hatch for custom setups).
   - Otherwise derive it from the incoming request's host, honouring the
     x-forwarded-* headers that Vercel/proxies set. This makes the same build
     work on http://localhost:3000 AND https://your-app.vercel.app with no env
     change — and, crucially, the redirect_uri sent at /auth always matches the
     one sent at /callback (same host), which is what Google checks. */
export function redirectUri(req?: Request) {
  const override = (process.env.GOOGLE_REDIRECT_URI ?? "").trim();
  if (override) return override;
  if (req) {
    const url = new URL(req.url);
    const proto = (req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "")).split(",")[0].trim();
    const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host).split(",")[0].trim();
    return `${proto}://${host}/api/gmail/callback`;
  }
  return "http://localhost:3000/api/gmail/callback";
}

export function authUrl(req?: Request) {
  const p = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: GMAIL_SCOPE,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export async function exchangeCode(code: string, req?: Request): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri(req),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshToken(refresh_token: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token,
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return (await res.json()).access_token;
}

const G = "https://gmail.googleapis.com/gmail/v1/users/me";

async function gget(token: string, pathAndQuery: string) {
  const res = await fetch(`${G}${pathAndQuery}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Gmail ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return res.json();
}

type Part = {
  filename?: string;
  mimeType?: string;
  body?: { attachmentId?: string; size?: number; data?: string };
  parts?: Part[];
};

function header(headers: { name: string; value: string }[], name: string) {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

const ATTACH_EXT = /\.(pdf|png|jpe?g|webp|docx|xlsx|xls|csv)$/i;

function collectAttachments(part: Part, out: { filename: string; mimeType: string; attachmentId: string }[]) {
  if (part.filename && part.body?.attachmentId && ATTACH_EXT.test(part.filename)) {
    out.push({ filename: part.filename, mimeType: part.mimeType ?? "application/octet-stream", attachmentId: part.body.attachmentId });
  }
  part.parts?.forEach((p) => collectAttachments(p, out));
}

export type GmailMessage = {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  bodyText: string;
  attachments: { filename: string; mimeType: string; attachmentId: string }[];
};

const b64urlDecode = (s: string) => {
  try {
    return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  } catch {
    return "";
  }
};

/** Walk MIME parts to pull the plain-text body (falls back to stripped HTML). */
function extractBody(part: Part): string {
  if (part.mimeType === "text/plain" && part.body?.data) return b64urlDecode(part.body.data);
  if (part.parts) {
    for (const p of part.parts) {
      const t = extractBody(p);
      if (t) return t;
    }
  }
  if (part.mimeType === "text/html" && part.body?.data) {
    return b64urlDecode(part.body.data).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  }
  return "";
}

/** Recent messages with attachments (invoices, applicant docs, …). */
export async function listInvoiceEmails(token: string, max = 12): Promise<GmailMessage[]> {
  const list = await gget(token, `/messages?q=has:attachment&maxResults=${max}`);
  const ids: { id: string }[] = list.messages ?? [];
  const out: GmailMessage[] = [];
  for (const { id } of ids) {
    const m = await gget(token, `/messages/${id}?format=full`);
    const headers = m.payload?.headers ?? [];
    const att: { filename: string; mimeType: string; attachmentId: string }[] = [];
    if (m.payload) collectAttachments(m.payload, att);
    if (!att.length) continue;
    out.push({
      id,
      from: header(headers, "From"),
      subject: header(headers, "Subject") || "(no subject)",
      date: header(headers, "Date"),
      snippet: m.snippet ?? "",
      bodyText: (m.payload ? extractBody(m.payload) : "") || m.snippet || "",
      attachments: att,
    });
  }
  return out;
}

/** Download one attachment as base64 (URL-safe → standard). */
export async function getAttachment(token: string, messageId: string, attachmentId: string): Promise<string> {
  const a = await gget(token, `/messages/${messageId}/attachments/${attachmentId}`);
  return (a.data ?? "").replace(/-/g, "+").replace(/_/g, "/");
}
