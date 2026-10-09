import type { Account, Payment } from "@prisma/client";
import { deletePayment } from "@/lib/actions/payments";
import { formatDate } from "@/lib/dates";
import { formatAmount } from "@/lib/money";
import { ActionButton } from "./ActionButton";

export function PaymentsList({ payments, currency }: { payments: (Payment & { account: Account })[]; currency: string }) {
  if (payments.length === 0) return <p className="text-sm text-slate-500">No payments recorded yet.</p>;
  return (
    <ul className="divide-y divide-slate-100 text-sm">
      {payments.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 py-2">
          <div>
            <div className="font-medium">
              {p.number} · {formatAmount(p.amount, currency)}
            </div>
            <div className="text-xs text-slate-500">
              {formatDate(p.date)} · {p.account.name}
              {p.method ? ` · ${p.method}` : ""}
              {p.reference ? ` · ${p.reference}` : ""}
            </div>
          </div>
          <ActionButton action={deletePayment.bind(null, p.id)} confirm="Delete this payment?" className="btn-ghost text-xs">
            Remove
          </ActionButton>
        </li>
      ))}
    </ul>
  );
}
