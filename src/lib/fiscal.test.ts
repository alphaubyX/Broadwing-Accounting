import { describe, expect, it } from "vitest";
import { fiscalYear } from "./fiscal";

describe("fiscalYear", () => {
  it("handles a calendar year", () => {
    expect(fiscalYear("2026-10-09", 12, 31)).toEqual({ from: "2026-01-01", to: "2026-12-31" });
  });
  it("handles a June year end", () => {
    expect(fiscalYear("2026-10-09", 6, 30)).toEqual({ from: "2026-07-01", to: "2027-06-30" });
    expect(fiscalYear("2026-03-01", 6, 30)).toEqual({ from: "2025-07-01", to: "2026-06-30" });
    expect(fiscalYear("2026-06-30", 6, 30)).toEqual({ from: "2025-07-01", to: "2026-06-30" });
  });
  it("clamps 29 February in non-leap years", () => {
    expect(fiscalYear("2027-01-10", 2, 29)).toEqual({ from: "2026-03-01", to: "2027-02-28" });
  });
});
