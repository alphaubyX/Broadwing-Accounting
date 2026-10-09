import { FileSpreadsheet, FileText, Receipt } from "lucide-react";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/org";

export const metadata = { title: "Data export" };

function ExportCard({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: string }) {
  return (
    <a href={href} download className="card flex items-center gap-5 p-6 transition hover:border-brand-500 hover:shadow">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</div>
      <div>
        <div className="text-base font-semibold text-slate-900">{title}</div>
        <div className="mt-0.5 text-sm text-slate-500">{detail}</div>
      </div>
    </a>
  );
}

export default async function ExportPage() {
  const org = await requireOrganization();
  const receipts = await db.attachment.count({ where: { organizationId: org.id } });
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Export your data</h2>
        <p className="text-sm text-slate-500">
          Export and download data from <strong className="text-slate-700">{org.name}</strong>.
        </p>
      </div>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Accounting</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <ExportCard
            href="/api/export/transactions.xlsx"
            icon={<FileSpreadsheet className="h-7 w-7" />}
            title="Export all transactions for Excel"
            detail="Journal, sales, expenses, payments, purchase orders, chart of accounts and contacts, one sheet each."
          />
          <ExportCard
            href="/api/export/transactions.csv"
            icon={<FileText className="h-7 w-7" />}
            title="Export all transactions as CSV"
            detail="Every debit and credit line, ready for any spreadsheet or accountant's software."
          />
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Receipts</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <ExportCard
            href="/api/export/receipts.zip"
            icon={<Receipt className="h-7 w-7" />}
            title="Export all receipts as a ZIP file"
            detail={`${receipts} file${receipts === 1 ? "" : "s"}, in one folder per transaction (e.g. EXP-0001/).`}
          />
        </div>
      </section>
    </div>
  );
}
