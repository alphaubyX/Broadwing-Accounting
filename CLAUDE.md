# Broadwing Accounting — repository notes

- This repository contains **only** the Broadwing Accounting web app. Work for other Broadwing products (for example the `Beaver` repository) does not belong here, and accounting work must not be committed to other repositories.
- Stack: **PHP 8.3+, Laravel 13**, MySQL/MariaDB (utf8mb4), Blade views, Tailwind CSS (compiled to `public/css/app.css`), Alpine.js (vendored in `public/js`). It runs on ordinary cPanel/shared PHP hosting: no Node.js, Composer or terminal on the server.
- The previous Next.js/Node.js prototype is preserved under the git tag `nodejs-prototype`.
- Before committing, run `php vendor/bin/phpunit` and `php artisan view:cache` (template check). After changing Blade classes, rebuild CSS with `npm run build:css`.
- Deployment package: `npm run package` → `dist/broadwing-accounting.tar.gz` / `.zip` (vendor included). See `docs/DEPLOY-FASTCOMET.md`.
- Accounting rules live in `app/Accounting/Posting.php` and are pure and unit-tested (`tests/Unit`). Do not write journal entries directly from controllers; go through `app/Accounting/Ledger.php`.
- Every query must be scoped by `organization_id`. The current organization comes from `App\Support\CurrentOrganization`.
- Users/sign-in are not implemented beyond a shared app password (`APP_PASSWORD_HASH`); real sign-in will come from the central Broadwing platform. `org_users` records roles.
- Schema changes: add a new migration in `database/migrations`; it is applied automatically on the first request after upload (`ApplyDatabaseUpdates` middleware).
- See `docs/ARCHITECTURE.md` for the design.
