"use server";

import { revalidatePath } from "next/cache";
import type { AccountSubtype, AccountType } from "@prisma/client";
import { db } from "@/lib/db";
import { handle, required, str, UserError, type ActionState } from "@/lib/forms";
import { requireOrganization } from "@/lib/org";
import { deleteUpload, isUpload, saveUpload } from "@/lib/storage";
import { SUBTYPES_BY_TYPE } from "@/lib/accounting/default-chart";
import { MAPPING_KEYS, type MappingKey } from "@/lib/accounting/mapping";

const done = (state: ActionState) => {
  revalidatePath("/", "layout");
  return state;
};

// ─── Business details ────────────────────────────────────────────────────────

export async function saveOrganization(_: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  return done(
    await handle(async () => {
      const month = Number(fd.get("fiscalYearStartMonth"));
      const terms = Number(fd.get("defaultPaymentTerms"));
      if (!(month >= 1 && month <= 12)) throw new UserError("Choose a fiscal year start month.");
      if (!(terms >= 0 && terms <= 365)) throw new UserError("Payment terms must be between 0 and 365 days.");

      let logoPath = org.logoPath;
      const logo = fd.get("logo");
      if (isUpload(logo)) {
        if (!logo.type.startsWith("image/")) throw new UserError("The logo must be an image.");
        try {
          logoPath = (await saveUpload(logo, `logos/${org.id}`)).storagePath;
        } catch (e) {
          throw new UserError((e as Error).message);
        }
        if (org.logoPath) await deleteUpload(org.logoPath);
      } else if (fd.get("removeLogo") === "on" && org.logoPath) {
        await deleteUpload(org.logoPath);
        logoPath = null;
      }

      await db.organization.update({
        where: { id: org.id },
        data: {
          name: required(fd, "name", "Business name"),
          legalName: str(fd, "legalName"),
          email: str(fd, "email"),
          phone: str(fd, "phone"),
          website: str(fd, "website"),
          addressLine1: str(fd, "addressLine1"),
          addressLine2: str(fd, "addressLine2"),
          city: str(fd, "city"),
          state: str(fd, "state"),
          postalCode: str(fd, "postalCode"),
          country: str(fd, "country"),
          taxNumber: str(fd, "taxNumber"),
          taxNumberLabel: str(fd, "taxNumberLabel") ?? "Tax number",
          currency: required(fd, "currency", "Currency"),
          fiscalYearStartMonth: month,
          defaultPaymentTerms: terms,
          logoPath,
        },
      });
    }),
  );
}

// ─── Invoice & PO design ─────────────────────────────────────────────────────

const pick = <T extends string>(v: FormDataEntryValue | null, options: readonly T[], fallback: T): T =>
  options.find((o) => o === v) ?? fallback;

export async function saveBranding(_: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  return done(
    await handle(async () => {
      const accent = str(fd, "accentColor") ?? "#2f6fed";
      if (!/^#[0-9a-fA-F]{6}$/.test(accent)) throw new UserError("Accent colour must be a hex colour like #2f6fed.");
      const data = {
        accentColor: accent,
        font: pick(fd.get("font"), ["sans", "serif", "mono"] as const, "sans"),
        layout: pick(fd.get("layout"), ["classic", "modern", "compact"] as const, "classic"),
        logoPosition: pick(fd.get("logoPosition"), ["left", "center", "right"] as const, "left"),
        addressPosition: pick(fd.get("addressPosition"), ["left", "right"] as const, "right"),
        showTaxNumber: fd.get("showTaxNumber") === "on",
        invoiceTitle: str(fd, "invoiceTitle") ?? "Invoice",
        invoiceNotes: str(fd, "invoiceNotes"),
        invoiceFooter: str(fd, "invoiceFooter"),
        poTitle: str(fd, "poTitle") ?? "Purchase Order",
        poNotes: str(fd, "poNotes"),
        poFooter: str(fd, "poFooter"),
        invoicePrefix: str(fd, "invoicePrefix") ?? "INV-",
        expensePrefix: str(fd, "expensePrefix") ?? "EXP-",
        poPrefix: str(fd, "poPrefix") ?? "PO-",
      };
      await db.branding.upsert({ where: { organizationId: org.id }, create: { organizationId: org.id, ...data }, update: data });
    }),
  );
}

// ─── Chart of accounts ───────────────────────────────────────────────────────

const ACCOUNT_TYPES: AccountType[] = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];

export async function saveAccount(accountId: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  return done(
    await handle(async () => {
      const type = ACCOUNT_TYPES.find((t) => t === fd.get("type"));
      if (!type) throw new UserError("Choose an account type.");
      const subtype = SUBTYPES_BY_TYPE[type].find((s) => s === fd.get("subtype")) as AccountSubtype | undefined;
      if (!subtype) throw new UserError("Choose a detail type that matches the account type.");
      const code = required(fd, "code", "Code");
      const data = { code, name: required(fd, "name", "Name"), type, subtype, description: str(fd, "description") };

      const clash = await db.account.findFirst({ where: { organizationId: org.id, code, NOT: accountId ? { id: accountId } : undefined } });
      if (clash) throw new UserError(`Code ${code} is already used by "${clash.name}".`);

      if (accountId) {
        const acc = await db.account.findFirst({ where: { id: accountId, organizationId: org.id }, include: { _count: { select: { journalLines: true } } } });
        if (!acc) throw new UserError("Account not found.");
        if (acc.type !== type && (acc._count.journalLines > 0 || acc.isSystem))
          throw new UserError("The type of an account that is in use cannot be changed.");
        await db.account.update({ where: { id: acc.id }, data });
      } else {
        await db.account.create({ data: { ...data, organizationId: org.id } });
      }
    }),
  );
}

export async function setAccountArchived(accountId: string, isArchived: boolean): Promise<ActionState> {
  const org = await requireOrganization();
  return done(
    await handle(async () => {
      const acc = await db.account.findFirst({ where: { id: accountId, organizationId: org.id }, include: { mappings: true } });
      if (!acc) throw new UserError("Account not found.");
      if (isArchived && acc.mappings.length) throw new UserError("This account is used in Account mapping. Change the mapping first.");
      await db.account.update({ where: { id: acc.id }, data: { isArchived } });
    }),
  );
}

// ─── Account mapping ─────────────────────────────────────────────────────────

export async function saveMappings(_: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  return done(
    await handle(async () => {
      const accounts = await db.account.findMany({ where: { organizationId: org.id, isArchived: false } });
      const byId = new Map(accounts.map((a) => [a.id, a]));
      await db.$transaction(
        (Object.keys(MAPPING_KEYS) as MappingKey[]).map((key) => {
          const id = str(fd, key);
          const acc = id ? byId.get(id) : undefined;
          const def = MAPPING_KEYS[key];
          if (!acc || !(def.types as readonly AccountType[]).includes(acc.type))
            throw new UserError(`Choose a valid account for "${def.label}".`);
          return db.accountMapping.upsert({
            where: { organizationId_key: { organizationId: org.id, key } },
            create: { organizationId: org.id, key, accountId: acc.id },
            update: { accountId: acc.id },
          });
        }),
      );
    }),
  );
}

// ─── Taxes ───────────────────────────────────────────────────────────────────

export async function saveTax(taxId: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  return done(
    await handle(async () => {
      const rate = Number(required(fd, "rate", "Rate"));
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new UserError("Rate must be between 0 and 100.");
      const accountId = required(fd, "accountId", "Account");
      const acc = await db.account.findFirst({ where: { id: accountId, organizationId: org.id, type: "LIABILITY" } });
      if (!acc) throw new UserError("Choose a liability account for this tax.");
      const data = { name: required(fd, "name", "Name"), rate, accountId };
      if (taxId) {
        const res = await db.tax.updateMany({ where: { id: taxId, organizationId: org.id }, data });
        if (!res.count) throw new UserError("Tax not found.");
      } else {
        await db.tax.create({ data: { ...data, organizationId: org.id } });
      }
    }),
  );
}

export async function setTaxArchived(taxId: string, isArchived: boolean): Promise<ActionState> {
  const org = await requireOrganization();
  return done(
    await handle(async () => {
      await db.tax.updateMany({ where: { id: taxId, organizationId: org.id }, data: { isArchived } });
    }),
  );
}
