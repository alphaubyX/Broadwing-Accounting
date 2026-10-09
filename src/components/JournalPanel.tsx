import type { JournalSource } from "@prisma/client";
import { db } from "@/lib/db";
import { formatAmount } from "@/lib/money";

/** Shows the double-entry lines behind a transaction, for transparency. */
export async function JournalPanel({ sources, currency }: { sources: { type: JournalSource; id: string }[]; currency: string }) {
  const entries = await db.journalEntry.findMany({
    where: { OR: sources.map((s) => ({ sourceType: s.type, sourceId: s.id })) },
    include: { lines: { include: { account: true }, orderBy: { debit: "desc" } } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  return (
    <details className="card p-5">
      <summary className="cursor-pointer text-sm font-semibold text-slate-900">Accounting entries</summary>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Not posted to the books (draft or void).</p>
      ) : (
        entries.map((e) => (
          <div key={e.id} className="mt-4">
            <div className="text-xs text-slate-500">{e.memo}</div>
            <table className="table mt-1 text-xs">
              <thead>
                <tr>
                  <th className="px-2">Account</th>
                  <th className="px-2 text-right">Debit</th>
                  <th className="px-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {e.lines.map((l) => (
                  <tr key={l.id}>
                    <td className="px-2 py-1.5">
                      {l.account.code} · {l.account.name}
                    </td>
                    <td className="px-2 py-1.5 text-right">{Number(l.debit) ? formatAmount(l.debit, currency) : ""}</td>
                    <td className="px-2 py-1.5 text-right">{Number(l.credit) ? formatAmount(l.credit, currency) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </details>
  );
}
