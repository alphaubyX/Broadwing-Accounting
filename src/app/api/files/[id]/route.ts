import { db } from "@/lib/db";
import { getOrganization } from "@/lib/org";
import { readUpload } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await getOrganization();
  if (!org) return new Response("Not found", { status: 404 });
  const a = await db.attachment.findFirst({ where: { id, organizationId: org.id } });
  if (!a) return new Response("Not found", { status: 404 });
  const body = await readUpload(a.storagePath).catch(() => null);
  if (!body) return new Response("File missing", { status: 404 });
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": a.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(a.fileName)}"`,
      "X-Content-Type-Options": "nosniff",
      // Uploaded SVGs must not run scripts in our origin.
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
