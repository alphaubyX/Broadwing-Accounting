import clsx from "clsx";

const STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  UNPAID: "bg-amber-50 text-amber-700",
  OVERDUE: "bg-red-50 text-red-700",
  PARTIAL: "bg-sky-50 text-sky-700",
  PAID: "bg-emerald-50 text-emerald-700",
  VOID: "bg-slate-100 text-slate-400 line-through",
  SENT: "bg-sky-50 text-sky-700",
  BILLED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-400",
};

const LABELS: Record<string, string> = { PARTIAL: "Part paid" };

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", STYLES[status] ?? STYLES.DRAFT)}>
      {LABELS[status] ?? status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

/** Show OVERDUE for unpaid documents past their due date. */
export function displayStatus(status: string, dueDate: Date | null | undefined): string {
  if ((status === "UNPAID" || status === "PARTIAL") && dueDate && dueDate < new Date(new Date().toISOString().slice(0, 10))) {
    return "OVERDUE";
  }
  return status;
}
