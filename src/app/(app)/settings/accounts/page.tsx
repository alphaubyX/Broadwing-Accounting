import Link from "next/link";
import type { AccountType } from "@prisma/client";
import { ActionButton } from "@/components/ActionButton";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/org";
import { ACCOUNT_TYPE_LABELS, SUBTYPE_LABELS, isDebitNormal } from "@/lib/accounting/default-chart";
import { saveAccount, setAccountArchived } from "../actions";
import { AccountForm } from "./AccountForm";

export const metadata = { title: "Chart of accounts" };

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ edit?: string; add?: string }> }) {
  const { edit, add } = await searchParams;
  const org = await requireOrganization();
  const accounts = await db.account.findMany({
    where: { organizationId: org.id },
    include: { mappings: true },
    orderBy: [{ isArchived: "asc" }, { code: "asc" }],
  });

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-slate-600">
            Accounts are the buckets your money is sorted into. Each type has a natural side:{" "}
            <strong>assets & expenses increase with debits</strong>, <strong>liabilities, equity & income increase with credits</strong>. You
            never need to pick debit or credit yourself — the app does it from the account type.
          </p>
          {!add && (
            <Link href="/settings/accounts?add=1" className="btn-primary">
              Add account
            </Link>
          )}
        </div>
        {add && (
          <div className="mt-4">
            <AccountForm action={saveAccount.bind(null, null)} submitLabel="Add account" />
          </div>
        )}
      </div>

      {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((type) => {
        const rows = accounts.filter((a) => a.type === type);
        return (
          <section key={type} className="card overflow-x-auto">
            <div className="flex items-center justify-between px-5 pt-4">
              <h2 className="text-sm font-semibold text-slate-900">{ACCOUNT_TYPE_LABELS[type]}</h2>
              <span className="text-xs text-slate-500">Increases with {isDebitNormal(type) ? "debits" : "credits"}</span>
            </div>
            <table className="table mt-2">
              <tbody>
                {rows.map((a) =>
                  edit === a.id ? (
                    <tr key={a.id}>
                      <td colSpan={4}>
                        <AccountForm action={saveAccount.bind(null, a.id)} initial={a} submitLabel="Save account" />
                        <Link href="/settings/accounts" className="btn-ghost mt-2">Close</Link>
                      </td>
                    </tr>
                  ) : (
                    <tr key={a.id} className={a.isArchived ? "opacity-50" : ""}>
                      <td className="w-20 text-slate-500">{a.code}</td>
                      <td>
                        <div className="font-medium text-slate-900">{a.name}</div>
                        {a.description && <div className="text-xs text-slate-500">{a.description}</div>}
                      </td>
                      <td className="text-slate-600">
                        {SUBTYPE_LABELS[a.subtype]}
                        {a.mappings.length > 0 && <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-700">default</span>}
                        {a.isArchived && <span className="ml-2 text-xs">archived</span>}
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <Link href={`/settings/accounts?edit=${a.id}`} className="btn-ghost text-xs">Edit</Link>
                        <ActionButton action={setAccountArchived.bind(null, a.id, !a.isArchived)} className="btn-ghost text-xs">
                          {a.isArchived ? "Restore" : "Archive"}
                        </ActionButton>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
