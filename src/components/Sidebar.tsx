"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, LayoutDashboard, Receipt, Settings, Users, Wallet } from "lucide-react";
import clsx from "clsx";

const MAIN = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", icon: Receipt },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/purchase-orders", label: "Purchase orders", icon: ClipboardList },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar({ orgName, hasLogo }: { orgName: string; hasLogo: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const item = (href: string, label: string, Icon: typeof Receipt) => (
    <Link
      key={href}
      href={href}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
        isActive(href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      {label}
    </Link>
  );

  return (
    <aside className="no-print flex w-full shrink-0 flex-col border-b border-slate-200 bg-white md:h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center gap-3 px-5 py-5">
        {hasLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/api/logo" alt="" className="h-9 w-9 rounded-md object-contain" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-500 text-sm font-bold text-white">
            {orgName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{orgName}</div>
          <div className="text-xs text-slate-500">Broadwing Accounting</div>
        </div>
      </div>
      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0 md:overflow-visible">
        {MAIN.map((n) => item(n.href, n.label, n.icon))}
        <div className="md:hidden">{item("/settings", "Settings", Settings)}</div>
      </nav>
      <div className="hidden px-3 py-4 md:block">{item("/settings", "Settings", Settings)}</div>
    </aside>
  );
}
