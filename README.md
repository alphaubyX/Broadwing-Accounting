# Broadwing Accounting

Simple, web-based accounting for small businesses, in the spirit of Wave and Xero. It is part of the wider **Broadwing** software suite.

It's built with **PHP (Laravel) and MySQL**, so it runs on ordinary cPanel hosting such as FastComet. You upload the package, open the site, and a setup page takes it from there.

![Dashboard](docs/screenshots/dashboard.png)

## Features

| Area | What you can do |
| --- | --- |
| **Installer** | On first visit: checks the server, asks for the MySQL details and an app password, then creates the tables. It locks itself afterwards. |
| **Setup** | Your name and email (you become the owner), business name, currency, fiscal year end, address, tax number and an optional sales tax. It creates a ready-made chart of accounts. |
| **Settings → Business profile** | Legal name, address, contact details and tax registration number (with your own label: TRN, NTN, VAT no., …). |
| **Settings → Users** | Invite Admins, Editors (optionally allowed to send invoices) and Viewers; edit or remove them. |
| **Settings → Invoice customization** | Logo (upload, change, remove, display on/off), accent colour (swatches, picker or hex), **Contemporary / Modern / Classic / Compact** templates with thumbnails and a live preview, fonts, layout, payment terms, notes, footers and numbering. |
| **Settings → Dates & currency** | Fiscal year end (month and day). The currency is locked after the first transaction. |
| **Settings → Sales taxes** | Name, abbreviation, rate, description, your tax number (optionally printed on invoices) and whether the tax is **recoverable**. |
| **Settings → Chart of accounts / Account mapping** | Add, edit and archive accounts. You choose which accounts receive the automatic entries. |
| **Settings → Subscription / Data export / Password** | Current plan; export all transactions for Excel, as CSV, and all receipts as a ZIP; change the app password. |
| **Sales** | Invoices or cash sales, drafts, approval, payments and part payments, void, attachments, and a branded print/PDF view. |
| **Expenses** | One screen for everything you buy: *already paid* (bank, cash or card) or *pay later* (a bill). Split across categories, add tax, and **attach a receipt or take a photo** with the phone camera. |
| **Purchase orders** | Branded POs with **Convert to expense** when the bill arrives. |
| **Reports** | Profit & loss, balance sheet, trial balance and journal, all from an automatic double-entry ledger. |

Every transaction gets a unique number (`INV-0001`, `EXP-0001`, `PO-0001`, `PAY-0001`), and each one shows the debits and credits behind it.

## Going live (cPanel / FastComet)

1. Build the package with `npm run package`, or use a provided `broadwing-accounting.tar.gz`.
2. Upload and extract it into the folder your (sub)domain points to.
3. Set that domain to **PHP 8.3 or newer**.
4. Open the site and follow the installer.

The full step-by-step guide is in [docs/DEPLOY-FASTCOMET.md](docs/DEPLOY-FASTCOMET.md).

## Development

Requirements: PHP 8.3+, Composer, MySQL/MariaDB. Node.js is needed only to rebuild the CSS.

```bash
composer install
npm install            # Tailwind CSS + Alpine.js (front-end build only)
npm run build:css
php artisan serve      # http://localhost:8000, then follow the installer
php vendor/bin/phpunit # accounting-engine unit tests
npm run package        # build dist/broadwing-accounting.tar.gz for upload
```

## Project layout

```
app/Accounting/      Accounting engine: Posting (pure double-entry rules), Ledger, Reports, Totals, Fiscal, Chart, Mapping, Money
app/Services/        Numbering, line pricing, organization setup, attachments, exports, .env writer
app/Http/            Controllers (sales, expenses, POs, payments, settings, installer…) and middleware
resources/views/     Blade templates (documents/render.blade.php draws invoices and POs)
database/migrations/ Schema (applied automatically on the first request after an upload)
public/              Web root: index.php, compiled CSS, JS
deploy/root.htaccess Sends requests to public/ when the domain points at the app folder
```

More detail is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
