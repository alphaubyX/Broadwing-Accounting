import { PageHeader } from "@/components/PageHeader";
import { today } from "@/lib/dates";
import { requireOrganization } from "@/lib/org";
import { saveExpense } from "../actions";
import { expenseFormData } from "../data";
import { ExpenseForm } from "../ExpenseForm";

export const metadata = { title: "New expense" };

export default async function NewExpensePage() {
  const org = await requireOrganization();
  const d = await expenseFormData(org.id);
  return (
    <>
      <PageHeader title="New expense" subtitle="Anything you buy — paid already or on payment terms." />
      <ExpenseForm
        action={saveExpense.bind(null, null)}
        defaults={{ payee: "", date: today(), dueDate: "", description: "", reference: "", settlement: "PAID_NOW", paidFromAccountId: d.defaultBankId }}
        vendorNames={d.vendorNames}
        categories={d.categories}
        payFromAccounts={d.payFromAccounts}
        taxes={d.taxes}
        defaultExpenseId={d.defaultExpenseId}
        currency={org.currency}
        paymentTerms={org.defaultPaymentTerms}
        cancelHref="/expenses"
        submitLabel="Save expense"
      />
    </>
  );
}
