import { getOrganization } from "@/lib/org";
import { receiptsZip, transactionsCsv, transactionsWorkbook } from "@/lib/export";
import { today } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const org = await getOrganization();
  if (!org) return new Response("Not found", { status: 404 });
  const base = `${org.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "broadwing"}-${today()}`;
  const download = (body: BodyInit, type: string, filename: string) =>
    new Response(body, {
      headers: { "Content-Type": type, "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" },
    });

  switch (kind) {
    case "transactions.xlsx":
      return download(
        new Uint8Array(await transactionsWorkbook(org.id, org.currency)),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        `${base}-transactions.xlsx`,
      );
    case "transactions.csv":
      return download(await transactionsCsv(org.id), "text/csv; charset=utf-8", `${base}-transactions.csv`);
    case "receipts.zip": {
      const { buffer } = await receiptsZip(org.id);
      return download(new Uint8Array(buffer), "application/zip", `${base}-receipts.zip`);
    }
    default:
      return new Response("Not found", { status: 404 });
  }
}
