import Link from "next/link";
import { UserPlus } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/org";
import { deleteUser, saveUser } from "../actions";
import { ROLE_INFO } from "@/lib/roles";
import { UserForm } from "./UserForm";

export const metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ edit?: string; invite?: string }> }) {
  const { edit, invite } = await searchParams;
  const org = await requireOrganization();
  const users = await db.orgUser.findMany({ where: { organizationId: org.id } });
  const order = { OWNER: 0, ADMIN: 1, EDITOR: 2, VIEWER: 3 };
  users.sort((a, b) => order[a.role] - order[b.role] || a.email.localeCompare(b.email));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{org.name} users</h2>
          <p className="max-w-2xl text-sm text-slate-500">
            Invite people to work in this business. Only give access to people you trust, since users can see your
            transactions and other business information.
          </p>
        </div>
        {!invite && (
          <Link href="/settings/users?invite=1" className="btn-primary">
            <UserPlus className="h-4 w-4" /> Invite user
          </Link>
        )}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Sign-in will come from your central Broadwing account. Until then this list records who should have access and
        with what role; invitations aren&apos;t emailed yet.
      </div>

      {invite && <UserForm action={saveUser.bind(null, null)} />}

      <section className="card divide-y divide-slate-100">
        {users.map((u) =>
          edit === u.id ? (
            <div key={u.id} className="p-4">
              <UserForm action={saveUser.bind(null, u.id)} user={u} />
            </div>
          ) : (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <div className="text-sm text-slate-900">
                  {u.name && <span className="font-medium">{u.name} · </span>}
                  {u.email}
                  {u.status === "INVITED" && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Invite pending</span>}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-600">
                  {ROLE_INFO[u.role].label}
                  {u.role === "EDITOR" && u.canSendInvoices && " + Send invoices"}
                </div>
              </div>
              <div className="flex gap-2">
                {u.role !== "OWNER" && (
                  <ActionButton action={deleteUser.bind(null, u.id)} confirm={`Remove ${u.email}'s access?`} className="btn-secondary rounded-full">
                    Delete
                  </ActionButton>
                )}
                <Link href={`/settings/users?edit=${u.id}`} className="btn-primary rounded-full">
                  Edit
                </Link>
              </div>
            </div>
          ),
        )}
      </section>
    </div>
  );
}
