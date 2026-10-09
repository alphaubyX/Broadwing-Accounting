"use client";

import { useState } from "react";
import { daysInMonth, MONTHS } from "@/lib/fiscal";

/** Month + day pickers for the fiscal year end; the day list follows the chosen month. */
export function FiscalYearEndFields({ month: initialMonth = 12, day: initialDay = 31 }: { month?: number; day?: number }) {
  const [month, setMonth] = useState(initialMonth);
  const [day, setDay] = useState(initialDay);
  const max = daysInMonth(month);
  return (
    <div>
      <span className="label">Fiscal year end</span>
      <div className="flex gap-2">
        <select
          name="fiscalYearEndMonth"
          aria-label="Fiscal year end month"
          value={month}
          onChange={(e) => {
            const m = Number(e.target.value);
            setMonth(m);
            setDay((d) => Math.min(d, daysInMonth(m)));
          }}
          className="input"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          name="fiscalYearEndDay"
          aria-label="Fiscal year end day"
          value={Math.min(day, max)}
          onChange={(e) => setDay(Number(e.target.value))}
          className="input w-24"
        >
          {Array.from({ length: max }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
