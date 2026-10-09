import JSZip from "jszip";
import ExcelJS from "exceljs";
import { db } from "./db";
import { toISODate } from "./dates";
import { toCents } from "./money";
import { readUpload } from "./storage";

type Cell = string | number | null;
interface Sheet {
  name: string;
  columns: { header: string; width?: number; money?: boolean }[];
  rows: Cell[][];
}

const amount = (v: unknown) => toCents(v as string) / 100;

/** Every journal line: the complete accounting record. */
async function journalSheet(organizationId: string): Promise<Sheet> {
  const lines = await db.journalLine.findMany({
    where: { journalEntry: { organizationId } },
    include: { journalEntry: true, account: true },
    orderBy: [{ journalEntry: { date: "asc" } }, { journalEntry: { createdAt: "asc" } }, { debit: "desc" }],
  });
  return {
    name: "All transactions",
    columns: [
      { header: "Date", width: 12 },
      { header: "Transaction", width: 14 },
      { header: "Type", width: 10 },
      { header: "Description", width: 44 },
      { header: "Account code", width: 12 },
      { header: "Account", width: 28 },
      { header: "Account type", width: 12 },
      { header: "Debit", width: 14, money: true },
      { header: "Credit", width: 14, money: true },
    ],
    rows: lines.map((l) => [
      toISODate(l.journalEntry.date),
      l.journalEntry.sourceNumber,
      l.journalEntry.sourceType,
      l.journalEntry.memo,
      l.account.code,
      l.account.name,
      l.account.type,
      amount(l.debit) || null,
      amount(l.credit) || null,
    ]),
  };
}

async function documentSheets(organizationId: string): Promise<Sheet[]> {
  const [sales, expenses, payments, pos, accounts, contacts] = await Promise.all([
    db.sale.findMany({ where: { organizationId }, include: { contact: true }, orderBy: { date: "asc" } }),
    db.expense.findMany({ where: { organizationId }, include: { contact: true, lines: { include: { account: true } } }, orderBy: { date: "asc" } }),
    db.payment.findMany({ where: { organizationId }, include: { account: true, sale: true, expense: true }, orderBy: { date: "asc" } }),
    db.purchaseOrder.findMany({ where: { organizationId }, include: { contact: true }, orderBy: { date: "asc" } }),
    db.account.findMany({ where: { organizationId }, orderBy: { code: "asc" } }),
    db.contact.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
  ]);
  const m = (header: string): Sheet["columns"][number] => ({ header, width: 14, money: true });
  return [
    {
      name: "Sales",
      columns: [{ header: "Number", width: 12 }, { header: "Date", width: 12 }, { header: "Due", width: 12 }, { header: "Customer", width: 28 }, { header: "Status", width: 10 }, m("Subtotal"), m("Tax"), m("Total"), m("Paid")],
      rows: sales.map((s) => [s.number, toISODate(s.date), toISODate(s.dueDate) || null, s.contact?.name ?? null, s.status, amount(s.subtotal), amount(s.taxTotal), amount(s.total), amount(s.amountPaid)]),
    },
    {
      name: "Expenses",
      columns: [{ header: "Number", width: 12 }, { header: "Date", width: 12 }, { header: "Paid to", width: 26 }, { header: "Description", width: 36 }, { header: "Categories", width: 28 }, { header: "Status", width: 10 }, m("Subtotal"), m("Tax"), m("Total"), m("Paid")],
      rows: expenses.map((e) => [
        e.number,
        toISODate(e.date),
        e.contact?.name ?? e.payeeName,
        e.description,
        [...new Set(e.lines.map((l) => l.account.name))].join(", "),
        e.status,
        amount(e.subtotal),
        amount(e.taxTotal),
        amount(e.total),
        amount(e.amountPaid),
      ]),
    },
    {
      name: "Payments",
      columns: [{ header: "Number", width: 12 }, { header: "Date", width: 12 }, { header: "For", width: 12 }, { header: "Direction", width: 10 }, { header: "Account", width: 24 }, { header: "Method", width: 14 }, { header: "Reference", width: 18 }, m("Amount")],
      rows: payments.map((p) => [p.number, toISODate(p.date), p.sale?.number ?? p.expense?.number ?? null, p.saleId ? "Received" : "Paid", p.account.name, p.method, p.reference, amount(p.amount)]),
    },
    {
      name: "Purchase orders",
      columns: [{ header: "Number", width: 12 }, { header: "Date", width: 12 }, { header: "Vendor", width: 28 }, { header: "Status", width: 10 }, m("Total")],
      rows: pos.map((p) => [p.number, toISODate(p.date), p.contact?.name ?? null, p.status, amount(p.total)]),
    },
    {
      name: "Chart of accounts",
      columns: [{ header: "Code", width: 10 }, { header: "Name", width: 30 }, { header: "Type", width: 12 }, { header: "Detail type", width: 22 }, { header: "Archived", width: 10 }],
      rows: accounts.map((a) => [a.code, a.name, a.type, a.subtype, a.isArchived ? "Yes" : "No"]),
    },
    {
      name: "Contacts",
      columns: [{ header: "Name", width: 28 }, { header: "Type", width: 10 }, { header: "Email", width: 28 }, { header: "Phone", width: 16 }, { header: "Tax number", width: 18 }],
      rows: contacts.map((c) => [c.name, c.type, c.email, c.phone, c.taxNumber]),
    },
  ];
}

export async function transactionsWorkbook(organizationId: string, currency: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Broadwing Accounting";
  for (const sheet of [await journalSheet(organizationId), ...(await documentSheets(organizationId))]) {
    const ws = wb.addWorksheet(sheet.name, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = sheet.columns.map((c) => ({
      header: c.money ? `${c.header} (${currency})` : c.header,
      width: c.width ?? 14,
      style: c.money ? { numFmt: "#,##0.00" } : {},
    }));
    ws.getRow(1).font = { bold: true };
    sheet.rows.forEach((r) => ws.addRow(r));
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Spreadsheet apps execute cells starting with these characters as formulas. */
function csvCell(v: Cell): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v);
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export async function transactionsCsv(organizationId: string): Promise<string> {
  const sheet = await journalSheet(organizationId);
  const lines = [sheet.columns.map((c) => c.header), ...sheet.rows].map((r) => r.map(csvCell).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n"; // BOM so Excel reads UTF-8
}

/** All receipts and attachments, one folder per transaction. */
export async function receiptsZip(organizationId: string): Promise<{ buffer: Buffer; count: number }> {
  const attachments = await db.attachment.findMany({
    where: { organizationId },
    include: { sale: true, expense: true, purchaseOrder: true },
    orderBy: { createdAt: "asc" },
  });
  const zip = new JSZip();
  const used = new Set<string>();
  let count = 0;
  for (const a of attachments) {
    const folder = a.expense?.number ?? a.sale?.number ?? a.purchaseOrder?.number ?? "Other";
    const safeName = a.fileName.replace(/[\\/:*?"<>|]/g, "_");
    let path = `${folder}/${safeName}`;
    for (let i = 2; used.has(path); i++) path = `${folder}/${i}-${safeName}`;
    const data = await readUpload(a.storagePath).catch(() => null);
    if (!data) continue;
    used.add(path);
    zip.file(path, data);
    count++;
  }
  return { buffer: await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }), count };
}
