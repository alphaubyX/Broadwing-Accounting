# Architecture

## Principles

1. **Simple on the surface, correct underneath.** Users see sales, expenses and purchase orders. The app keeps a real double-entry general ledger behind them.
2. **The ledger is derived, not typed.** Journal entries are generated from source documents by pure functions (`src/lib/accounting/posting.ts`). When a document changes, its journal entries are deleted and regenerated inside the same database transaction, so the books always match the documents.
3. **Every record belongs to an organization.** All tables carry `organizationId`. The app currently runs in *single-organization mode* (`src/lib/org.ts` picks the first organization). Moving to multi-tenant under Broadwing's central identity means changing that one function.
4. **No auth yet, by design.** Logins and users will come from the central Broadwing platform. The integration point is `requireOrganization()` in `src/lib/org.ts`.

## Main flows and their postings

| Event | Debit | Credit |
| --- | --- | --- |
| Sale on terms (invoice) | Accounts receivable | Income account(s), Sales tax |
| Cash sale | Bank / cash | Income account(s), Sales tax |
| Customer payment | Bank / cash | Accounts receivable |
| Expense, already paid | Expense category(ies), Tax | Bank / cash / card |
| Expense, pay later (bill) | Expense category(ies), Tax | Accounts payable |
| Bill payment | Accounts payable | Bank / cash / card |
| Purchase order | *(no posting: a commitment, not a transaction)* | |
| PO → Convert to expense | becomes a bill (see above) | |

Tax on purchases is debited to the same tax account that sales tax is credited to, so its balance is the net amount owed to the tax authority. Prices are tax-exclusive.

Which accounts are used for receivables, payables, tax, the default bank and the default categories is configurable under **Settings → Account mapping** (`AccountMapping` table, keys in `src/lib/accounting/mapping.ts`).

## Document life cycle

- **Sales:** `DRAFT` (not posted) → `UNPAID` → `PARTIAL` → `PAID`, or `VOID` (removed from the books). Cash sales are `PAID` immediately.
- **Expenses:** posted on save. *Already paid* expenses are `PAID`. Bills move `UNPAID` → `PARTIAL` → `PAID` as payments are recorded.
- **Purchase orders:** `DRAFT` → `SENT` → `BILLED` (converted to an expense), or `CANCELLED`.
- `OVERDUE` is a display state: unpaid and past the due date.

## Numbers and money

- Unique, human-readable numbers come from the per-organization `Sequence` table (`INV-0001`, `EXP-0001`, `PO-0001`, `PAY-0001`). Prefixes are configurable.
- Amounts are calculated in integer minor units (cents) and stored as `DECIMAL(14,2)`.

## Files

Logos and receipts are stored on local disk under `UPLOAD_DIR` through `src/lib/storage.ts`. They are served through `/api/files/[id]` and `/api/logo`, scoped to the organization and sandboxed. To move to S3 or Azure Blob storage, replace that one module. The "Take photo" button uses the browser's camera capture, so on phones it opens the camera directly.

## Code map

```
src/lib/accounting/posting.ts   pure posting rules (unit-tested in posting.test.ts)
src/lib/accounting/ledger.ts    repostSale / repostExpense / repostPayment / syncPaymentStatus
src/lib/accounting/reports.ts   account balances, P&L, balance sheet, trial balance
src/lib/lines.ts                validates line items and computes amounts
src/lib/sequence.ts             transaction numbering
src/lib/org.ts                  current organization (future auth integration point)
src/app/(app)/**/actions.ts     server actions per module
```

## Not yet built (suggested next steps)

- Central Broadwing identity (users, roles) and multi-organization switching
- Opening balances and manual journal entries (the `MANUAL` journal source already exists)
- Bank feeds or CSV import, and bank reconciliation
- Emailing invoices and POs, plus server-generated PDFs
- Recurring invoices, quotes/estimates and credit notes
- Products and items list, inventory tracking
- Multi-currency transactions; currencies with 3 decimals (KWD, BHD, OMR) are displayed with 3 decimals but currently stored at 2
- Year-end closing to retained earnings (the balance sheet currently shows all accumulated profit as "Profit to date")
- Audit trail, and locking periods after filing
