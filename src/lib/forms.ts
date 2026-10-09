import { z } from "zod";

/** Trimmed string or null for optional text fields. */
export function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function required(fd: FormData, key: string, label: string): string {
  const v = str(fd, key);
  if (!v) throw new UserError(`${label} is required.`);
  return v;
}

/** Errors whose message is safe to show to the user. */
export class UserError extends Error {}

export type ActionState = { error?: string | null; ok?: boolean };

/** Run a server action body and turn UserErrors into form state. */
export async function handle(fn: () => Promise<void>): Promise<ActionState> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    if (e instanceof UserError) return { error: e.message };
    // Re-throw redirects and other framework signals.
    throw e;
  }
}

const decimal = z
  .string()
  .trim()
  .transform((s) => (s === "" ? 0 : Number(s.replace(/,/g, ""))))
  .refine((n) => Number.isFinite(n), "Enter a valid number");

export const lineSchema = z.object({
  description: z.string().trim(),
  quantity: decimal,
  unitPrice: decimal,
  accountId: z.string(),
  taxId: z.string(),
});

export type ParsedLine = z.infer<typeof lineSchema>;

export function parseLines(fd: FormData): ParsedLine[] {
  const raw = fd.get("lines");
  let json: unknown;
  try {
    json = JSON.parse(typeof raw === "string" ? raw : "[]");
  } catch {
    throw new UserError("Line items could not be read.");
  }
  const parsed = z.array(lineSchema).safeParse(json);
  if (!parsed.success) throw new UserError("Please check the amounts on the line items.");
  const lines = parsed.data.filter((l) => l.description !== "" || l.unitPrice !== 0);
  if (lines.length === 0) throw new UserError("Add at least one line with an amount.");
  return lines;
}
