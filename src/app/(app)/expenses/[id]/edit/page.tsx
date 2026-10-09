import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { db } from "@/lib/db";
import { toISODate } from "@/lib/dates";
import { toEditableLines } from "@/lib/options";
import { requireOrganization } from "@/lib/org";
import { saveExpense } from "../../actions";
import { expenseFormData } from "../../data";
import { ExpenseForm } from "../../ExpenseForm";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrganization();
  const expense = await db.expense.findFirst({
    where: { id, organizationId: org.id },
    include: { lines: { orderBy: { position: "asc" } }, contact: true },
  });
  if (!expense) notFound();
  const d = await expenseFormData(org.id);
  return (
    <>
      <PageHeader title={`Edit ${expense.number}`} />
      <ExpenseForm
        action={saveExpense.bind(null, expense.id)}
        defaults={{
          payee: expense.contact?.name ?? expense.payeeName ?? "",
          date: toISODate(expense.date),
          dueDate: toISODate(expense.dueDate),
          description: expense.description,
          reference: expense.reference ?? "",
          settlement: expense.settlement,
          paidFromAccountId: expense.paidFromAccountId ?? d.defaultBankId,
          lines: toEditableLines(expense.lines),
        }}
        vendorNames={d.vendorNames}
        categories={d.categories}
        payFromAccounts={d.payFromAccounts}
        taxes={d.taxes}
        defaultExpenseId={d.defaultExpenseId}
        currency={org.currency}
        paymentTerms={org.defaultPaymentTerms}
        cancelHref={`/expenses/${expense.id}`}
        submitLabel="Save changes"
      />
    </>
  );
}
