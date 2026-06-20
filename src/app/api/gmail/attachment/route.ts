import { cookies } from "next/headers";
import { getAttachment, refreshToken } from "@/lib/google";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messageId, attachmentId } = (await req.json()) as {
    messageId: string;
    attachmentId: string;
  };
  const jar = await cookies();
  let access = jar.get("g_access")?.value;
  const refresh = jar.get("g_refresh")?.value;

  try {
    if (!access && refresh) access = await refreshToken(refresh);
    if (!access) return Response.json({ error: "Not connected" }, { status: 401 });
    let data: string;
    try {
      data = await getAttachment(access, messageId, attachmentId);
    } catch {
      if (refresh) {
        access = await refreshToken(refresh);
        data = await getAttachment(access, messageId, attachmentId);
      } else throw new Error("fetch failed");
    }
    return Response.json({ data });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 500 },
    );
  }
}
