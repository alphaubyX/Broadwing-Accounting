import Link from "next/link";
import clsx from "clsx";

export function DocTabs({ base, current, tabs }: { base: string; current: string; tabs: { value: string; label: string }[] }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((t) => (
        <Link
          key={t.value}
          href={t.value === "all" ? base : `${base}?status=${t.value}`}
          className={clsx(
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium",
            current === t.value ? "border-brand-500 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
