# Broadwing Accounting

Simple, web-based accounting for small businesses, in the spirit of Wave and Xero. It is part of the wider **Broadwing** software suite.

The goal is that anyone can set it up and use it alone, without long configuration. You enter your business details once, and every sale, expense and payment is then posted to a proper double-entry ledger automatically.

![Dashboard](docs/screenshots/dashboard.png)

## What's in this first draft

| Area | What you can do |
| --- | --- |
| **Setup** | A one-page wizard: your name and email (you become the owner), business name, currency, fiscal year end, address, tax number and an optional sales tax. It creates a ready-made chart of accounts. |
| **Settings → Business profile** | Legal name, address, contact details and tax registration number (with your own label, such as TRN, NTN or VAT no.). |
| **Settings → Users** | Invite users as Admin, Editor (optionally allowed to send invoices) or Viewer; edit or remove them. The owner is fixed. *Sign-in comes later from the central Broadwing account.* |
| **Settings → Invoice customization** | Logo (upload, change, remove, display on/off), accent colour (swatches, colour picker or hex), templates (**Contemporary**, Modern, Classic, Compact) with thumbnails and a **live preview**, font, logo and address position, payment terms, default notes, footers and numbering. |
| **Settings → Dates & currency** | Fiscal year end (month and day). The business currency is locked once the first transaction is recorded. |
| **Settings → Sales taxes** | Create, edit and delete taxes: name, abbreviation, description, rate, your tax number (optionally printed on invoices, e.g. `GST 16% (3092834)`) and whether the tax is **recoverable**. |
| **Settings → Chart of accounts / Account mapping** | Add, edit and archive accounts. Each account type knows its debit/credit side. Mapping chooses which accounts receive the automatic entries. |
| **Settings → Manage subscription** | Shows the current plan (billing will be managed centrally by Broadwing). |
| **Settings → Data export** | All transactions **for Excel** (one sheet each for journal, sales, expenses, payments, POs, accounts and contacts), all transactions **as CSV**, and all **receipts as a ZIP** (one folder per transaction). |
| **Sales** | Invoices (the customer pays later) or cash sales (paid now). Drafts, approval, payments, part payments, void, a branded print/PDF view and attachments. |
| **Expenses** | **One screen for all purchases and expenses**: either *Already paid* (from bank, cash or card) or *Pay later* (a bill). Split across categories, add tax, and **attach a receipt or take a photo with the camera**, at entry time or later. |
| **Purchase orders** | Branded POs to vendors, with **Convert to expense** when the bill arrives. |
| **Contacts** | Customers and vendors. |
| **Reports** | Profit & loss, balance sheet, trial balance and the full journal. |

Every transaction gets a unique number, such as `INV-0001`, `EXP-0001`, `PO-0001` or `PAY-0001`. Each sale and expense also shows the accounting entries behind it.

Logins are **not included yet**. Users and their roles are recorded under Settings → Users, and sign-in will come from Broadwing's central identity service later (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).

## Tech stack

- **Next.js 15** (App Router, React Server Components, Server Actions) with TypeScript
- **MySQL / MariaDB** with the **Prisma** ORM (works with the MySQL service on cPanel hosting such as FastComet)
- **Tailwind CSS**
- **Vitest** for unit tests of the accounting rules

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure the database connection
cp .env.example .env        # then set DATABASE_URL=mysql://user:password@host:3306/dbname

# 3. Create the database tables
npx prisma migrate deploy   # or `npm run db:migrate` during development

# 4. Run the app
npm run dev                 # http://localhost:3000
```

The first time you open the app, it takes you to the setup wizard.

### Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build && npm start` | Production build and server |
| `npm test` | Unit tests (posting rules, totals) |
| `npm run typecheck` | TypeScript check |
| `npm run db:migrate` | Create or apply migrations in development |
| `npm run db:studio` | Browse the database |

## Project layout

```
prisma/schema.prisma          Data model (organization, accounts, sales, expenses, POs, ledger…)
src/lib/accounting/           The accounting engine
  posting.ts                  Pure double-entry rules (sale, expense, payment → journal lines)
  ledger.ts                   Writes and rewrites journal entries in the database
  totals.ts                   Line, tax and total maths (integer cents)
  reports.ts                  P&L, balance sheet, trial balance
  default-chart.ts            Starter chart of accounts
  mapping.ts                  Automatic-entry account mapping keys
src/app/(app)/                Screens: dashboard, sales, expenses, purchase-orders, contacts, reports, settings
src/app/print/                Print / PDF views of invoices and POs
src/app/setup/                First-run setup wizard
src/components/               Shared UI (line-item editor, camera/attachment picker, document renderer…)
```

More detail is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
