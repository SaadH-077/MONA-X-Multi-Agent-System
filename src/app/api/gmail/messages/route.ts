import { cookies } from "next/headers";
import { listInvoiceEmails, refreshToken, googleConfigured } from "@/lib/google";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  if (!googleConfigured()) {
    return Response.json({ connected: false, configured: false, emails: [] });
  }
  const jar = await cookies();
  let access = jar.get("g_access")?.value;
  const refresh = jar.get("g_refresh")?.value;

  if (!access && !refresh) {
    return Response.json({ connected: false, configured: true, emails: [] });
  }

  try {
    if (!access && refresh) access = await refreshToken(refresh);
    let emails;
    try {
      emails = await listInvoiceEmails(access!);
    } catch {
      // access token likely expired → refresh and retry once
      if (refresh) {
        access = await refreshToken(refresh);
        emails = await listInvoiceEmails(access);
      } else {
        throw new Error("expired");
      }
    }
    return Response.json({ connected: true, configured: true, emails });
  } catch (e) {
    return Response.json(
      { connected: false, configured: true, emails: [], error: e instanceof Error ? e.message : "failed" },
      { status: 200 },
    );
  }
}
