import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Deployment check: is the app running and can it reach the database? */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, database: "connected" });
  } catch {
    return Response.json({ ok: false, database: "unreachable — check DATABASE_URL" }, { status: 503 });
  }
}
