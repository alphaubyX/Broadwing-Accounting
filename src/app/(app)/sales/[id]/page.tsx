import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Printer } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import { DocumentView } from "@/components/DocumentView";
import { JournalPanel } from "@/components/JournalPanel";
import { PageHeader } from "@/components/PageHeader";
import { PaymentForm } from "@/components/PaymentForm";
import { PaymentsList } from "@/components/PaymentsList";
import { StatusBadge, displayStatus } from "@/components/StatusBadge";
import { recordPayment } from "@/lib/actions/payments";
import { db } from "@/lib/db";
import { brandingStyle, saleDocument, toDocumentOrg } from "@/lib/document";
import { today } from "@/lib/dates";
import { formatAmount, formatMoney, fromCents, toCents } from "@/lib/money";
import { accountOptions, mappedAccountId, RECEIVE_INTO } from "@/lib/options";
import { requireOrganization } from "@/lib/org";
import { approveSale, deleteSale, voidSale } from "../actions";

export default async function SalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrganization();
  const sale = await db.sale.findFirst({
    where: { id, organizationId: org.id },
    include: {
      contact: true,
      lines: { orderBy: { position: "asc" } },
      payments: { include: { account: true }, orderBy: { date: "asc" } },
      attachments: { orderBy: { createdAt: "asc" } },
      paidIntoAccount: true,
    },
  });
  if (!sale) notFound();

  const c = org.currency;
  const dueCents = toCents(sale.total) - toCents(sale.amountPaid);
  const posted = sale.status !== "DRAFT" && sale.status !== "VOID";
  const [bankAccounts, defaultBank] = await Promise.all([
    accountOptions(org.id, { subtypes: RECEIVE_INTO }),
    mappedAccountId(org.id, "DEFAULT_BANK"),
  ]);

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {sale.number} <StatusBadge status={displayStatus(sale.status, sale.dueDate)} />
          </span>
        }
        subtitle={sale.contact?.name ?? "Walk-in customer"}
        actions={
          <>
            {sale.status !== "VOID" && (
              <Link href={`/sales/${sale.id}/edit`} className="btn-secondary">
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            )}
            <Link href={`/print/sales/${sale.id}`} target="_blank" className="btn-secondary">
              <Printer className="h-4 w-4" /> Print / PDF
            </Link>
            {sale.status === "DRAFT" && <ActionButton action={approveSale.bind(null, sale.id)} className="btn-primary">Approve</ActionButton>}
            {posted && (
              <ActionButton action={voidSale.bind(null, sale.id)} confirm="Void this sale? It will be removed from your books." className="btn-danger">
                Void
              </ActionButton>
            )}
            {!posted && (
              <ActionButton action={deleteSale.bind(null, sale.id)} confirm="Delete this sale permanently?" className="btn-danger">
                Delete
              </ActionButton>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 overflow-x-auto rounded-xl border border-slate-200">
          <DocumentView org={toDocumentOrg(org)} doc={saleDocument(org, sale)} style={brandingStyle(org)} />
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Total</dt><dd className="font-medium">{formatAmount(sale.total, c)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Paid</dt><dd>{formatAmount(sale.amountPaid, c)}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold"><dt>Balance due</dt><dd>{sale.status === "VOID" ? "—" : formatMoney(dueCents, c)}</dd></div>
            </dl>
            {sale.settlement === "PAID_NOW" && sale.paidIntoAccount && (
              <p className="mt-3 text-xs text-slate-500">Paid on the sale date into {sale.paidIntoAccount.name}.</p>
            )}
          </section>

          {sale.settlement === "ON_TERMS" && posted && (
            <section className="card space-y-4 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Payments received</h2>
              <PaymentsList payments={sale.payments} currency={c} />
              {dueCents > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <PaymentForm
                    action={recordPayment.bind(null, "SALE", sale.id)}
                    accounts={bankAccounts}
                    defaultAccountId={defaultBank}
                    amountDue={fromCents(dueCents)}
                    today={today()}
                    label="Deposited to"
                  />
                </div>
              )}
            </section>
          )}

          <AttachmentsPanel target="sale" id={sale.id} attachments={sale.attachments} />
          <JournalPanel
            currency={c}
            sources={[{ type: "SALE", id: sale.id }, ...sale.payments.map((p) => ({ type: "PAYMENT" as const, id: p.id }))]}
          />
        </div>
      </div>
    </>
  );
}
