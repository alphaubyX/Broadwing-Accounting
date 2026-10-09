"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/lib/forms";

/** A button that runs a bound server action, with optional confirmation and inline errors. */
export function ActionButton({
  action,
  children,
  confirm,
  className = "btn-secondary",
}: {
  action: () => Promise<ActionState | void>;
  children: React.ReactNode;
  confirm?: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError(null);
          start(async () => {
            const res = await action();
            if (res && res.error) setError(res.error);
          });
        }}
      >
        {pending ? "Working…" : children}
      </button>
      {error && <span className="mt-1 max-w-xs text-xs text-red-600">{error}</span>}
    </span>
  );
}
