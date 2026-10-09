import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { DocTabs } from "@/components/DocTabs";
import { PageHeader } from "@/components/PageHeader";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/org";

export const metadata = { title: "Contacts" };

const FILTERS: Record<string, Prisma.ContactWhereInput> = {
  customers: { type: { in: ["CUSTOMER", "BOTH"] }, isArchived: false },
  vendors: { type: { in: ["VENDOR", "BOTH"] }, isArchived: false },
  archived: { isArchived: true },
};
const TYPE_LABEL = { CUSTOMER: "Customer", VENDOR: "Vendor", BOTH: "Customer & vendor" };

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const org = await requireOrganization();
  const contacts = await db.contact.findMany({
    where: { organizationId: org.id, ...(FILTERS[status] ?? { isArchived: false }) },
    orderBy: { name: "asc" },
  });
  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle="Customers you sell to and vendors you buy from."
        actions={
          <Link href="/contacts/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New contact
          </Link>
        }
      />
      <DocTabs
        base="/contacts"
        current={status}
        tabs={[
          { value: "all", label: "All" },
          { value: "customers", label: "Customers" },
          { value: "vendors", label: "Vendors" },
          { value: "archived", label: "Archived" },
        ]}
      />
      <div className="card overflow-x-auto">
        {contacts.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-slate-500">No contacts yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td>
                    <Link href={`/contacts/${c.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                      {c.name}
                    </Link>
                  </td>
                  <td className="text-slate-600">{TYPE_LABEL[c.type]}</td>
                  <td className="text-slate-600">{c.email ?? "—"}</td>
                  <td className="text-slate-600">{c.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
