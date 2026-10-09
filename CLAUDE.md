# Broadwing Accounting — repository notes

- This repository contains **only** the Broadwing Accounting web app. Work for other Broadwing products (for example the `Beaver` repository) does not belong here, and accounting work must not be committed to other repositories.
- Stack: Next.js 15 (App Router, Server Actions), TypeScript, Prisma + PostgreSQL, Tailwind CSS, Vitest.
- Before committing, run `npm run typecheck`, `npm test` and `npm run build`.
- Accounting rules live in `src/lib/accounting/posting.ts` and are pure and unit-tested. Do not write journal entries directly from UI code; go through `src/lib/accounting/ledger.ts`.
- Every query must be scoped by `organizationId`. The current organization comes from `requireOrganization()` in `src/lib/org.ts`.
- Users and auth are intentionally absent; they will come from the central Broadwing platform.
- See `docs/ARCHITECTURE.md` for the design.
