"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AccountSubtype, AccountType } from "@prisma/client";
import { db } from "@/lib/db";
import { handle, required, str, UserError, type ActionState } from "@/lib/forms";
import { requireOrganization } from "@/lib/org";
import { deleteUpload, isUpload, saveUpload } from "@/lib/storage";
import { SUBTYPES_BY_TYPE } from "@/lib/accounting/default-chart";
import { CURRENCIES } from "@/lib/currencies";
import { daysInMonth } from "@/lib/fiscal";
import { hasTransactions } from "@/lib/books";
import { MAPPING_KEYS, type MappingKey } from "@/lib/accounting/mapping";

const done = (state: ActionState) => {
  revalidatePath("/", "layout");
  return state;
};

// ─── Business profile ────────────────────────────────────────────────────────

export async function saveProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  return done(
    await handle(async () => {
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
        },
      });
    }),
  );
}

// ─── Invoice customization ───────────────────────────────────────────────────

const pick = <T extends string>(v: FormDataEntryValue | null, options: readonly T[], fallback: T): T =>
  options.find((o) => o === v) ?? fallback;

export async function saveInvoiceSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  return done(
    await handle(async () => {
      const accent = str(fd, "accentColor") ?? "#2f6fed";
      if (!/^#[0-9a-fA-F]{6}$/.test(accent)) throw new UserError("Accent colour must be a hex colour like #2f6fed.");
      const terms = Number(fd.get("defaultPaymentTerms"));
      if (!Number.isInteger(terms) || terms < 0 || terms > 365) throw new UserError("Payment terms must be between 0 and 365 days.");

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
      } else if (fd.get("removeLogo") === "1" && org.logoPath) {
        await deleteUpload(org.logoPath);
        logoPath = null;
      }

      const data = {
        accentColor: accent.toLowerCase(),
        showLogo: fd.get("showLogo") === "on",
        font: pick(fd.get("font"), ["sans", "serif", "mono"] as const, "sans"),
        layout: pick(fd.get("layout"), ["contemporary", "modern", "classic", "compact"] as const, "contemporary"),
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
      await db.$transaction([
        db.organization.update({ where: { id: org.id }, data: { logoPath, defaultPaymentTerms: terms } }),
        db.branding.upsert({ where: { organizationId: org.id }, create: { organizationId: org.id, ...data }, update: data }),
      ]);
    }),
  );
}

// ─── Dates & currency ────────────────────────────────────────────────────────

export async function saveDatesCurrency(_: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  return done(
    await handle(async () => {
      const month = Number(fd.get("fiscalYearEndMonth"));
      const day = Number(fd.get("fiscalYearEndDay"));
      if (!(Number.isInteger(month) && month >= 1 && month <= 12)) throw new UserError("Choose the month your fiscal year ends.");
      if (!(Number.isInteger(day) && day >= 1 && day <= daysInMonth(month))) throw new UserError("Choose a valid day for the fiscal year end.");
      const currency = str(fd, "currency") ?? org.currency;
      if (!CURRENCIES.some((c) => c.code === currency)) throw new UserError("Unknown currency.");
      if (currency !== org.currency && (await hasTransactions(org.id)))
        throw new UserError("The business currency can't be changed once transactions have been recorded.");
      await db.organization.update({
        where: { id: org.id },
        data: { fiscalYearEndMonth: month, fiscalYearEndDay: day, currency },
      });
    }),
  );
}

// ─── Users ───────────────────────────────────────────────────────────────────

const ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;

export async function saveUser(userId: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  const state = done(
    await handle(async () => {
      const email = required(fd, "email", "Email").toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new UserError("Enter a valid email address.");
      const name = str(fd, "name");
      const canSendInvoices = fd.get("canSendInvoices") === "on";
      const clash = await db.orgUser.findFirst({ where: { organizationId: org.id, email, NOT: userId ? { id: userId } : undefined } });
      if (clash) throw new UserError(`${email} already has access.`);

      if (userId) {
        const user = await db.orgUser.findFirst({ where: { id: userId, organizationId: org.id } });
        if (!user) throw new UserError("User not found.");
        // The owner's role is fixed; ownership transfer will come with central Broadwing accounts.
        const role = user.role === "OWNER" ? "OWNER" : pick(fd.get("role"), ROLES, "EDITOR");
        await db.orgUser.update({
          where: { id: user.id },
          data: { email, name, role, canSendInvoices: role === "OWNER" || role === "ADMIN" ? true : canSendInvoices },
        });
      } else {
        const role = pick(fd.get("role"), ROLES, "EDITOR");
        await db.orgUser.create({
          data: { organizationId: org.id, email, name, role, canSendInvoices: role === "ADMIN" ? true : canSendInvoices, status: "INVITED" },
        });
      }
    }),
  );
  if (state.ok) redirect("/settings/users");
  return state;
}

export async function deleteUser(userId: string): Promise<ActionState> {
  const org = await requireOrganization();
  return done(
    await handle(async () => {
      const user = await db.orgUser.findFirst({ where: { id: userId, organizationId: org.id } });
      if (!user) throw new UserError("User not found.");
      if (user.role === "OWNER") throw new UserError("The owner can't be removed.");
      await db.orgUser.delete({ where: { id: user.id } });
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

// ─── Sales taxes ─────────────────────────────────────────────────────────────

export async function saveTax(taxId: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  const state = done(
    await handle(async () => {
      const rate = Number(required(fd, "rate", "Tax rate"));
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new UserError("Tax rate must be between 0 and 100.");
      const accountId = str(fd, "accountId") ?? (await db.accountMapping.findUnique({ where: { organizationId_key: { organizationId: org.id, key: "SALES_TAX" } } }))?.accountId;
      const acc = accountId ? await db.account.findFirst({ where: { id: accountId, organizationId: org.id, type: "LIABILITY" } }) : null;
      if (!acc) throw new UserError("Choose a liability account for this tax.");
      const data = {
        name: required(fd, "name", "Tax name"),
        abbreviation: required(fd, "abbreviation", "Abbreviation"),
        description: str(fd, "description"),
        taxNumber: str(fd, "taxNumber"),
        showTaxNumber: fd.get("showTaxNumber") === "on",
        isRecoverable: fd.get("isRecoverable") === "on",
        rate,
        accountId: acc.id,
      };
      if (taxId) {
        const res = await db.tax.updateMany({ where: { id: taxId, organizationId: org.id }, data });
        if (!res.count) throw new UserError("Tax not found.");
      } else {
        await db.tax.create({ data: { ...data, organizationId: org.id } });
      }
    }),
  );
  if (state.ok) redirect("/settings/taxes");
  return state;
}

/** Delete an unused tax; a tax already used on transactions is archived instead so history stays intact. */
export async function deleteTax(taxId: string): Promise<ActionState> {
  const org = await requireOrganization();
  return done(
    await handle(async () => {
      const tax = await db.tax.findFirst({
        where: { id: taxId, organizationId: org.id },
        include: { _count: { select: { saleLines: true, expenseLines: true, poLines: true } } },
      });
      if (!tax) throw new UserError("Tax not found.");
      const used = tax._count.saleLines + tax._count.expenseLines + tax._count.poLines > 0;
      if (used) await db.tax.update({ where: { id: tax.id }, data: { isArchived: true } });
      else await db.tax.delete({ where: { id: tax.id } });
    }),
  );
}

export async function restoreTax(taxId: string): Promise<ActionState> {
  const org = await requireOrganization();
  return done(
    await handle(async () => {
      await db.tax.updateMany({ where: { id: taxId, organizationId: org.id }, data: { isArchived: false } });
    }),
  );
}
