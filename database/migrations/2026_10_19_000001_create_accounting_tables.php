<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Broadwing Accounting data model.
 *
 * Every business record is scoped by organization_id so the app can later serve
 * several organizations from the central Broadwing platform.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('legal_name')->nullable();
            $t->string('email')->nullable();
            $t->string('phone')->nullable();
            $t->string('website')->nullable();
            $t->string('address_line1')->nullable();
            $t->string('address_line2')->nullable();
            $t->string('city')->nullable();
            $t->string('state')->nullable();
            $t->string('postal_code')->nullable();
            $t->string('country')->nullable();
            $t->string('tax_number')->nullable();
            $t->string('tax_number_label')->default('Tax number');
            $t->string('currency', 3)->default('USD');
            $t->unsignedTinyInteger('fiscal_year_end_month')->default(12);
            $t->unsignedTinyInteger('fiscal_year_end_day')->default(31);
            $t->unsignedSmallInteger('default_payment_terms')->default(30);
            $t->string('logo_path', 500)->nullable();
            $t->string('plan')->default('STARTER');
            $t->timestamps();
        });

        Schema::create('brandings', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->unique()->constrained()->cascadeOnDelete();
            $t->string('accent_color', 7)->default('#2f6fed');
            $t->string('font')->default('sans');
            $t->string('layout')->default('contemporary');
            $t->string('logo_position')->default('left');
            $t->string('address_position')->default('right');
            $t->boolean('show_tax_number')->default(true);
            $t->boolean('show_logo')->default(true);
            $t->string('invoice_title')->default('Invoice');
            $t->text('invoice_notes')->nullable();
            $t->text('invoice_footer')->nullable();
            $t->string('po_title')->default('Purchase Order');
            $t->text('po_notes')->nullable();
            $t->text('po_footer')->nullable();
            $t->string('invoice_prefix')->default('INV-');
            $t->string('expense_prefix')->default('EXP-');
            $t->string('po_prefix')->default('PO-');
            $t->timestamps();
        });

        Schema::create('sequences', function (Blueprint $t) {
            $t->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $t->string('key', 10);
            $t->unsignedInteger('next')->default(1);
            $t->primary(['organization_id', 'key']);
        });

        Schema::create('accounts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $t->string('code', 20);
            $t->string('name');
            $t->string('type', 20);      // ASSET | LIABILITY | EQUITY | INCOME | EXPENSE
            $t->string('subtype', 40);   // see App\Accounting\Chart::SUBTYPES
            $t->text('description')->nullable();
            $t->boolean('is_system')->default(false);
            $t->boolean('is_archived')->default(false);
            $t->timestamps();
            $t->unique(['organization_id', 'code']);
        });

        Schema::create('account_mappings', function (Blueprint $t) {
            $t->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $t->string('key', 40);
            $t->foreignId('account_id')->constrained();
            $t->primary(['organization_id', 'key']);
        });

        Schema::create('taxes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('abbreviation', 40);
            $t->text('description')->nullable();
            $t->string('tax_number')->nullable();
            $t->boolean('show_tax_number')->default(false);
            $t->boolean('is_recoverable')->default(true);
            $t->decimal('rate', 7, 3);
            $t->foreignId('account_id')->constrained();
            $t->boolean('is_archived')->default(false);
            $t->timestamps();
        });

        Schema::create('contacts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $t->string('type', 10)->default('CUSTOMER'); // CUSTOMER | VENDOR | BOTH
            $t->string('name');
            $t->string('email')->nullable();
            $t->string('phone')->nullable();
            $t->text('address')->nullable();
            $t->string('tax_number')->nullable();
            $t->text('notes')->nullable();
            $t->boolean('is_archived')->default(false);
            $t->timestamps();
        });

        Schema::create('sales', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $t->string('number', 40);
            $t->foreignId('contact_id')->nullable()->constrained();
            $t->date('date');
            $t->date('due_date')->nullable();
            $t->string('reference')->nullable();
            $t->text('notes')->nullable();
            $t->string('settlement', 10)->default('ON_TERMS'); // PAID_NOW | ON_TERMS
            $t->foreignId('paid_into_account_id')->nullable()->constrained('accounts');
            $t->string('status', 10)->default('DRAFT'); // DRAFT | UNPAID | PARTIAL | PAID | VOID
            $t->decimal('subtotal', 14, 2)->default(0);
            $t->decimal('tax_total', 14, 2)->default(0);
            $t->decimal('total', 14, 2)->default(0);
            $t->decimal('amount_paid', 14, 2)->default(0);
            $t->timestamps();
            $t->unique(['organization_id', 'number']);
            $t->index(['organization_id', 'date']);
        });

        Schema::create('sale_lines', function (Blueprint $t) {
            $t->id();
            $t->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $t->unsignedSmallInteger('position');
            $t->string('description', 500);
            $t->decimal('quantity', 14, 4);
            $t->decimal('unit_price', 14, 4);
            $t->decimal('amount', 14, 2);
            $t->decimal('tax_amount', 14, 2)->default(0);
            $t->foreignId('account_id')->constrained();
            $t->foreignId('tax_id')->nullable()->constrained();
        });

        Schema::create('purchase_orders', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $t->string('number', 40);
            $t->foreignId('contact_id')->nullable()->constrained();
            $t->date('date');
            $t->date('expected_date')->nullable();
            $t->string('reference')->nullable();
            $t->text('notes')->nullable();
            $t->string('status', 10)->default('DRAFT'); // DRAFT | SENT | BILLED | CANCELLED
            $t->decimal('subtotal', 14, 2)->default(0);
            $t->decimal('tax_total', 14, 2)->default(0);
            $t->decimal('total', 14, 2)->default(0);
            $t->timestamps();
            $t->unique(['organization_id', 'number']);
        });

        Schema::create('purchase_order_lines', function (Blueprint $t) {
            $t->id();
            $t->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $t->unsignedSmallInteger('position');
            $t->string('description', 500);
            $t->decimal('quantity', 14, 4);
            $t->decimal('unit_price', 14, 4);
            $t->decimal('amount', 14, 2);
            $t->decimal('tax_amount', 14, 2)->default(0);
            $t->foreignId('account_id')->nullable()->constrained();
            $t->foreignId('tax_id')->nullable()->constrained();
        });

        // One screen for everything you buy: cash expenses and bills on payment terms.
        Schema::create('expenses', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $t->string('number', 40);
            $t->foreignId('contact_id')->nullable()->constrained();
            $t->string('payee_name')->nullable();
            $t->date('date');
            $t->date('due_date')->nullable();
            $t->string('description', 500);
            $t->string('reference')->nullable();
            $t->string('settlement', 10)->default('PAID_NOW');
            $t->foreignId('paid_from_account_id')->nullable()->constrained('accounts');
            $t->string('status', 10)->default('UNPAID');
            $t->decimal('subtotal', 14, 2)->default(0);
            $t->decimal('tax_total', 14, 2)->default(0);
            $t->decimal('total', 14, 2)->default(0);
            $t->decimal('amount_paid', 14, 2)->default(0);
            $t->foreignId('purchase_order_id')->nullable()->unique()->constrained()->nullOnDelete();
            $t->timestamps();
            $t->unique(['organization_id', 'number']);
            $t->index(['organization_id', 'date']);
        });

        Schema::create('expense_lines', function (Blueprint $t) {
            $t->id();
            $t->foreignId('expense_id')->constrained()->cascadeOnDelete();
            $t->unsignedSmallInteger('position');
            $t->string('description', 500);
            $t->decimal('amount', 14, 2);
            $t->decimal('tax_amount', 14, 2)->default(0);
            $t->foreignId('account_id')->constrained();
            $t->foreignId('tax_id')->nullable()->constrained();
        });

        // Money received against a sale or paid against an expense on terms.
        Schema::create('payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $t->string('number', 40);
            $t->date('date');
            $t->decimal('amount', 14, 2);
            $t->foreignId('account_id')->constrained();
            $t->string('method')->nullable();
            $t->string('reference')->nullable();
            $t->foreignId('sale_id')->nullable()->constrained()->cascadeOnDelete();
            $t->foreignId('expense_id')->nullable()->constrained()->cascadeOnDelete();
            $t->timestamps();
            $t->unique(['organization_id', 'number']);
        });

        // Double-entry journal, generated from sales, expenses and payments
        // (see App\Accounting\Posting) and regenerated when the source changes.
        Schema::create('journal_entries', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $t->date('date');
            $t->string('memo', 500);
            $t->string('source_type', 10); // SALE | EXPENSE | PAYMENT | MANUAL
            $t->unsignedBigInteger('source_id')->nullable();
            $t->string('source_number', 40)->nullable();
            $t->timestamps();
            $t->index(['organization_id', 'date']);
            $t->index(['source_type', 'source_id']);
        });

        Schema::create('journal_lines', function (Blueprint $t) {
            $t->id();
            $t->foreignId('journal_entry_id')->constrained()->cascadeOnDelete();
            $t->foreignId('account_id')->constrained();
            $t->string('description', 500)->nullable();
            $t->decimal('debit', 14, 2)->default(0);
            $t->decimal('credit', 14, 2)->default(0);
        });

        Schema::create('attachments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $t->string('file_name', 500);
            $t->string('mime_type');
            $t->unsignedInteger('size');
            $t->string('storage_path', 500);
            $t->foreignId('sale_id')->nullable()->constrained()->cascadeOnDelete();
            $t->foreignId('expense_id')->nullable()->constrained()->cascadeOnDelete();
            $t->foreignId('purchase_order_id')->nullable()->constrained()->cascadeOnDelete();
            $t->timestamps();
        });

        // People with access to this organization. Sign-in itself will come from
        // Broadwing's central identity service; this records the role per organization.
        Schema::create('org_users', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $t->string('name')->nullable();
            $t->string('email');
            $t->string('role', 10)->default('EDITOR'); // OWNER | ADMIN | EDITOR | VIEWER
            $t->boolean('can_send_invoices')->default(false);
            $t->string('status', 10)->default('INVITED'); // INVITED | ACTIVE
            $t->timestamps();
            $t->unique(['organization_id', 'email']);
        });
    }

    public function down(): void
    {
        foreach ([
            'org_users', 'attachments', 'journal_lines', 'journal_entries', 'payments', 'expense_lines',
            'expenses', 'purchase_order_lines', 'purchase_orders', 'sale_lines', 'sales', 'contacts',
            'taxes', 'account_mappings', 'accounts', 'sequences', 'brandings', 'organizations',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
