"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const GROUPS = [
  { title: "Business", items: [{ href: "/settings", label: "Business profile" }] },
  { title: "User management", items: [{ href: "/settings/users", label: "Users" }] },
  { title: "Sales & payments", items: [{ href: "/settings/invoice", label: "Invoice customization" }] },
  {
    title: "Accounting",
    items: [
      { href: "/settings/dates-currency", label: "Dates & currency" },
      { href: "/settings/taxes", label: "Sales taxes" },
      { href: "/settings/accounts", label: "Chart of accounts" },
      { href: "/settings/mapping", label: "Account mapping" },
    ],
  },
  {
    title: "Other",
    items: [
      { href: "/settings/subscription", label: "Manage subscription" },
      { href: "/settings/export", label: "Data export" },
    ],
  },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-4 overflow-x-auto md:flex-col md:gap-5">
      {GROUPS.map((g) => (
        <div key={g.title} className="flex shrink-0 items-center gap-1 md:block">
          <div className="hidden px-3 pb-1 text-xs font-medium text-slate-500 md:block">{g.title}</div>
          {g.items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={clsx(
                "block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium",
                pathname === i.href ? "bg-white text-brand-700 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {i.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
