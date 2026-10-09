import { addDays } from "./dates";

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Days in a month, using a leap year so 29 February can be chosen as a year end. */
export function daysInMonth(month: number): number {
  return new Date(Date.UTC(2000, month, 0)).getUTCDate();
}

function yearEnd(year: number, month: number, day: number): string {
  // Clamp e.g. 29 Feb to 28 Feb in non-leap years.
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(day, last)).padStart(2, "0")}`;
}

/** The fiscal year containing `dateIso`, given the month/day the fiscal year ends. */
export function fiscalYear(dateIso: string, endMonth: number, endDay: number): { from: string; to: string } {
  const year = Number(dateIso.slice(0, 4));
  const thisEnd = yearEnd(year, endMonth, endDay);
  const to = dateIso <= thisEnd ? thisEnd : yearEnd(year + 1, endMonth, endDay);
  const previousEnd = yearEnd(Number(to.slice(0, 4)) - 1, endMonth, endDay);
  return { from: addDays(previousEnd, 1), to };
}
