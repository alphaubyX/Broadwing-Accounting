# Architecture

## Principles

0. **Plain PHP hosting.** Laravel + MySQL, packaged with its dependencies, so it runs on shared cPanel hosting with no Node.js, Composer or terminal. A first-run installer writes `.env`; database updates run automatically on the first request after an upload (`app/Http/Middleware/ApplyDatabaseUpdates.php`).
1. **Simple on the surface, correct underneath.** Users see sales, expenses and purchase orders. The app keeps a real double-entry general ledger behind them.
2. **The ledger is derived, not typed.** Journal entries are generated from source documents by pure functions (`app/Accounting/Posting.php`). When a document changes, its journal entries are deleted and regenerated inside the same database transaction, so the books always match the documents.
3. **Every record belongs to an organization.** All tables carry `organizationId`. The app currently runs in *single-organization mode* (`app/Support/CurrentOrganization.php` picks the first organization). Moving to multi-tenant under Broadwing's central identity means changing that one function.
4. **No individual sign-in yet, by design.** A shared app password (`APP_PASSWORD_HASH` in `.env`, checked by `RequirePassword` middleware) protects the app. Logins will come from the central Broadwing platform; `org_users` already records who has access and with which role (Owner, Admin, Editor, Viewer; `App\Models\OrgUser::ROLES`). The integration point is `App\Support\CurrentOrganization`.

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

Tax on purchases is debited to the same tax account that sales tax is credited to, so its balance is the net amount owed to the tax authority. A tax marked **not recoverable** (for example FED on card charges) is debited to the expense category instead, because it is part of the cost. Prices are tax-exclusive. Invoices show one tax line per tax, with your registration number when "Show tax number on invoices" is on.

## Fiscal year and currency

The fiscal year is defined by its end date (month and day, `app/Accounting/Fiscal.php`). It drives the default report period and "profit this fiscal year" on the dashboard. The business currency can only change while there are no journal entries, because amounts are never converted.

## Data export

`app/Services/Exporter.php` builds the exports: `transactions.xlsx` (PhpSpreadsheet), `transactions.csv` (journal lines, with spreadsheet-formula injection guarded) and `receipts.zip` (ZipArchive, one folder per transaction number).

Which accounts are used for receivables, payables, tax, the default bank and the default categories is configurable under **Settings → Account mapping** (`account_mappings` table, keys in `app/Accounting/Mapping.php`).

## Document life cycle

- **Sales:** `DRAFT` (not posted) → `UNPAID` → `PARTIAL` → `PAID`, or `VOID` (removed from the books). Cash sales are `PAID` immediately.
- **Expenses:** posted on save. *Already paid* expenses are `PAID`. Bills move `UNPAID` → `PARTIAL` → `PAID` as payments are recorded.
- **Purchase orders:** `DRAFT` → `SENT` → `BILLED` (converted to an expense), or `CANCELLED`.
- `OVERDUE` is a display state: unpaid and past the due date.

## Numbers and money

- Unique, human-readable numbers come from the per-organization `Sequence` table (`INV-0001`, `EXP-0001`, `PO-0001`, `PAY-0001`). Prefixes are configurable.
- Amounts are calculated in integer minor units (cents) and stored as `DECIMAL(14,2)`.

## Files

Logos and receipts are stored in `storage/app/private` (outside the web root) through `app/Services/AttachmentStore.php`, and served only through the app (`/files/{id}`, `/logo`), scoped to the organization and sandboxed. Laravel's filesystem layer can switch this to S3-compatible storage by configuration. The "Take photo" button uses the browser's camera capture, so on phones it opens the camera directly.

## Code map

```
app/Accounting/Posting.php        pure posting rules (unit-tested in tests/Unit/PostingTest.php)
app/Accounting/Ledger.php         repostSale / repostExpense / repostPayment / syncPaymentStatus
app/Accounting/Reports.php        account balances, P&L, balance sheet, trial balance
app/Services/LinePricer.php       validates line items and computes amounts
app/Services/Sequence.php         transaction numbering
app/Support/Documents.php         data for invoice / PO documents (rendered by resources/views/documents/render.blade.php)
app/Http/Controllers/             one controller per area; Settings/ for the settings pages
```

## Not yet built (suggested next steps)

- Central Broadwing sign-in, enforcing the recorded user roles, and multi-organization switching
- Estimates/quotes (Wave's "Invoices and estimates")
- Opening balances and manual journal entries (the `MANUAL` journal source already exists)
- Bank feeds or CSV import, and bank reconciliation
- Emailing invoices and POs, plus server-generated PDFs
- Recurring invoices, quotes/estimates and credit notes
- Products and items list, inventory tracking
- Multi-currency transactions; currencies with 3 decimals (KWD, BHD, OMR) are displayed with 3 decimals but currently stored at 2
- Year-end closing to retained earnings (the balance sheet currently shows all accumulated profit as "Profit to date")
- Audit trail, and locking periods after filing
