"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/settings", label: "Business details" },
  { href: "/settings/branding", label: "Invoice & PO design" },
  { href: "/settings/accounts", label: "Chart of accounts" },
  { href: "/settings/mapping", label: "Account mapping" },
  { href: "/settings/taxes", label: "Taxes" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {ITEMS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={clsx(
            "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium",
            pathname === i.href ? "bg-white text-brand-700 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-slate-100",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
