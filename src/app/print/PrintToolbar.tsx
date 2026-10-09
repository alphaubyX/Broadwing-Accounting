"use client";

export function PrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="no-print mx-auto mb-4 flex max-w-[820px] justify-between">
      <a href={backHref} className="btn-ghost">
        ← Back
      </a>
      <button type="button" className="btn-primary" onClick={() => window.print()}>
        Print / Save as PDF
      </button>
    </div>
  );
}
