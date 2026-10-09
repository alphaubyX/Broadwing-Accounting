import { Check } from "lucide-react";
import { requireOrganization } from "@/lib/org";

export const metadata = { title: "Manage subscription" };

const PLANS: Record<string, { name: string; features: string[] }> = {
  STARTER: {
    name: "Starter",
    features: ["Unlimited sales, expenses and purchase orders", "Receipt capture and attachments", "Profit & loss, balance sheet and trial balance", "Excel, CSV and receipt exports"],
  },
};

export default async function SubscriptionPage() {
  const org = await requireOrganization();
  const plan = PLANS[org.plan] ?? { name: org.plan, features: [] };
  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Manage subscription</h2>
      <section className="card p-6">
        <h3 className="text-base font-semibold text-slate-900">Current plan</h3>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded bg-slate-100 px-2 py-1 text-sm font-bold uppercase tracking-wide text-slate-700">{plan.name}</span>
          <span className="text-lg font-medium text-slate-900">Plan</span>
        </div>
        <ul className="mt-5 space-y-2 text-sm text-slate-600">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
              {f}
            </li>
          ))}
        </ul>
      </section>
      <p className="text-center text-sm text-slate-500">
        Billing and plan changes will be managed from your central Broadwing account.
      </p>
    </div>
  );
}
