import { getOrganization } from "@/lib/org";
import { readUpload } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const org = await getOrganization();
  if (!org?.logoPath) return new Response("Not found", { status: 404 });
  const body = await readUpload(org.logoPath).catch(() => null);
  if (!body) return new Response("Not found", { status: 404 });
  const ext = org.logoPath.split(".").pop()?.toLowerCase();
  const type = ext === "svg" ? "image/svg+xml" : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": type,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "Cache-Control": "private, max-age=60",
    },
  });
}
