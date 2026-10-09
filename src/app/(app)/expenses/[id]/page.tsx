import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import { JournalPanel } from "@/components/JournalPanel";
import { PageHeader } from "@/components/PageHeader";
import { PaymentForm } from "@/components/PaymentForm";
import { PaymentsList } from "@/components/PaymentsList";
import { StatusBadge, displayStatus } from "@/components/StatusBadge";
import { recordPayment } from "@/lib/actions/payments";
import { db } from "@/lib/db";
import { formatDate, today } from "@/lib/dates";
import { formatAmount, formatMoney, fromCents, toCents } from "@/lib/money";
import { accountOptions, mappedAccountId, PAY_FROM } from "@/lib/options";
import { requireOrganization } from "@/lib/org";
import { deleteExpense } from "../actions";

export default async function ExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrganization();
  const expense = await db.expense.findFirst({
    where: { id, organizationId: org.id },
    include: {
      contact: true,
      lines: { include: { account: true, tax: true }, orderBy: { position: "asc" } },
      payments: { include: { account: true }, orderBy: { date: "asc" } },
      attachments: { orderBy: { createdAt: "asc" } },
      paidFromAccount: true,
      purchaseOrder: true,
    },
  });
  if (!expense) notFound();

  const c = org.currency;
  const dueCents = toCents(expense.total) - toCents(expense.amountPaid);
  const [payFrom, defaultBank] = await Promise.all([accountOptions(org.id, { subtypes: PAY_FROM }), mappedAccountId(org.id, "DEFAULT_BANK")]);

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {expense.number} <StatusBadge status={displayStatus(expense.status, expense.dueDate)} />
          </span>
        }
        subtitle={expense.description}
        actions={
          <>
            <Link href={`/expenses/${expense.id}/edit`} className="btn-secondary">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <ActionButton action={deleteExpense.bind(null, expense.id)} confirm="Delete this expense and its payments?" className="btn-danger">
              Delete
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card p-6">
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <Item label="Date" value={formatDate(expense.date)} />
              <Item label="Paid to" value={expense.contact?.name ?? expense.payeeName ?? "—"} />
              <Item label="Receipt / bill no." value={expense.reference ?? "—"} />
              {expense.settlement === "PAID_NOW" ? (
                <Item label="Paid from" value={expense.paidFromAccount?.name ?? "—"} />
              ) : (
                <Item label="Due date" value={formatDate(expense.dueDate)} />
              )}
              {expense.purchaseOrder && (
                <Item
                  label="Purchase order"
                  value={
                    <Link href={`/purchase-orders/${expense.purchaseOrder.id}`} className="text-brand-600 hover:underline">
                      {expense.purchaseOrder.number}
                    </Link>
                  }
                />
              )}
            </dl>
            <table className="table mt-6">
              <thead>
                <tr>
                  <th className="px-0">Description</th>
                  <th>Category</th>
                  <th>Tax</th>
                  <th className="pr-0 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expense.lines.map((l) => (
                  <tr key={l.id}>
                    <td className="px-0">{l.description}</td>
                    <td className="text-slate-600">{l.account.name}</td>
                    <td className="text-slate-600">{l.tax ? `${l.tax.name} ${formatAmount(l.taxAmount, c)}` : "—"}</td>
                    <td className="pr-0 text-right">{formatAmount(l.amount, c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ml-auto mt-4 w-60 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatAmount(expense.subtotal, c)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Tax</dt><dd>{formatAmount(expense.taxTotal, c)}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold"><dt>Total</dt><dd>{formatAmount(expense.total, c)}</dd></div>
            </dl>
          </section>
          <AttachmentsPanel target="expense" id={expense.id} attachments={expense.attachments} />
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Total</dt><dd className="font-medium">{formatAmount(expense.total, c)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Paid</dt><dd>{formatAmount(expense.amountPaid, c)}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold"><dt>Still to pay</dt><dd>{formatMoney(dueCents, c)}</dd></div>
            </dl>
          </section>
          {expense.settlement === "ON_TERMS" && (
            <section className="card space-y-4 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Payments made</h2>
              <PaymentsList payments={expense.payments} currency={c} />
              {dueCents > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <PaymentForm
                    action={recordPayment.bind(null, "EXPENSE", expense.id)}
                    accounts={payFrom}
                    defaultAccountId={defaultBank}
                    amountDue={fromCents(dueCents)}
                    today={today()}
                    label="Paid from"
                  />
                </div>
              )}
            </section>
          )}
          <JournalPanel
            currency={c}
            sources={[{ type: "EXPENSE", id: expense.id }, ...expense.payments.map((p) => ({ type: "PAYMENT" as const, id: p.id }))]}
          />
        </div>
      </div>
    </>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
    </div>
  );
}
