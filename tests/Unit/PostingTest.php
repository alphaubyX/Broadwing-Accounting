<?php

namespace Tests\Unit;

use App\Accounting\Posting;
use App\Accounting\Totals;
use PHPUnit\Framework\TestCase;

class PostingTest extends TestCase
{
    private array $map = [
        'ACCOUNTS_RECEIVABLE' => 'ar', 'ACCOUNTS_PAYABLE' => 'ap', 'SALES_TAX' => 'tax', 'DEFAULT_INCOME' => 'sales',
        'DEFAULT_EXPENSE' => 'general', 'DEFAULT_BANK' => 'bank', 'RETAINED_EARNINGS' => 're',
    ];

    private function balance(array $posting, string $account): int
    {
        $sum = 0;
        foreach ($posting['lines'] as $l) {
            if ($l['account_id'] === $account) {
                $sum += $l['debit'] - $l['credit'];
            }
        }

        return $sum;
    }

    private function sale(array $overrides = []): array
    {
        return $overrides + [
            'number' => 'INV-0001', 'counterparty' => 'Acme', 'settlement' => 'ON_TERMS', 'status' => 'UNPAID', 'money_account_id' => null,
            'lines' => [
                ['account_id' => 'sales', 'amount_cents' => 10000, 'tax_cents' => 1500, 'tax_account_id' => null],
                ['account_id' => 'services', 'amount_cents' => 5000, 'tax_cents' => 0, 'tax_account_id' => null],
            ],
        ];
    }

    private function expense(array $overrides = []): array
    {
        return $overrides + [
            'number' => 'EXP-0001', 'counterparty' => null, 'settlement' => 'PAID_NOW', 'status' => 'PAID', 'money_account_id' => null,
            'lines' => [
                ['account_id' => 'rent', 'amount_cents' => 100000, 'tax_cents' => 0, 'tax_account_id' => null],
                ['account_id' => 'general', 'amount_cents' => 2000, 'tax_cents' => 300, 'tax_account_id' => null],
            ],
        ];
    }

    public function test_document_totals_are_tax_exclusive_in_cents(): void
    {
        $t = Totals::document([
            ['quantity' => 2, 'unit_price_cents' => 1050, 'tax_rate' => 15],
            ['quantity' => 1, 'unit_price_cents' => 999],
        ]);
        $this->assertSame(3099, $t['subtotal_cents']);
        $this->assertSame(315, $t['tax_cents']);
        $this->assertSame(3414, $t['total_cents']);
    }

    public function test_sale_on_terms_debits_receivables_and_credits_income_and_tax(): void
    {
        $p = Posting::sale($this->sale(), $this->map);
        $this->assertSame(16500, $this->balance($p, 'ar'));
        $this->assertSame(-10000, $this->balance($p, 'sales'));
        $this->assertSame(-5000, $this->balance($p, 'services'));
        $this->assertSame(-1500, $this->balance($p, 'tax'));
    }

    public function test_cash_sale_debits_the_bank(): void
    {
        $p = Posting::sale($this->sale(['settlement' => 'PAID_NOW', 'money_account_id' => 'cash']), $this->map);
        $this->assertSame(16500, $this->balance($p, 'cash'));
        $this->assertSame(0, $this->balance($p, 'ar'));
    }

    public function test_drafts_and_voided_sales_are_not_posted(): void
    {
        $this->assertNull(Posting::sale($this->sale(['status' => 'DRAFT']), $this->map));
        $this->assertNull(Posting::sale($this->sale(['status' => 'VOID']), $this->map));
    }

    public function test_expense_debits_categories_and_recoverable_tax_and_credits_bank(): void
    {
        $p = Posting::expense($this->expense(), $this->map);
        $this->assertSame(100000, $this->balance($p, 'rent'));
        $this->assertSame(2000, $this->balance($p, 'general'));
        $this->assertSame(300, $this->balance($p, 'tax'));
        $this->assertSame(-102300, $this->balance($p, 'bank'));
    }

    public function test_non_recoverable_tax_is_part_of_the_expense_cost(): void
    {
        $p = Posting::expense($this->expense(['lines' => [
            ['account_id' => 'general', 'amount_cents' => 2000, 'tax_cents' => 300, 'tax_account_id' => 'tax', 'tax_recoverable' => false],
        ]]), $this->map);
        $this->assertSame(2300, $this->balance($p, 'general'));
        $this->assertSame(0, $this->balance($p, 'tax'));
        $this->assertSame(-2300, $this->balance($p, 'bank'));
    }

    public function test_bill_on_terms_credits_accounts_payable(): void
    {
        $p = Posting::expense($this->expense(['settlement' => 'ON_TERMS', 'status' => 'UNPAID']), $this->map);
        $this->assertSame(-102300, $this->balance($p, 'ap'));
        $this->assertSame(0, $this->balance($p, 'bank'));
    }

    public function test_payments_clear_receivables_and_payables(): void
    {
        $in = Posting::payment(['number' => 'PAY-0001', 'amount_cents' => 500, 'bank_account_id' => 'bank', 'kind' => 'SALE', 'document_number' => 'INV-0001'], $this->map);
        $this->assertSame(500, $this->balance($in, 'bank'));
        $this->assertSame(-500, $this->balance($in, 'ar'));
        $out = Posting::payment(['number' => 'PAY-0002', 'amount_cents' => 500, 'bank_account_id' => 'bank', 'kind' => 'EXPENSE', 'document_number' => 'EXP-0001'], $this->map);
        $this->assertSame(500, $this->balance($out, 'ap'));
        $this->assertSame(-500, $this->balance($out, 'bank'));
    }

    public function test_payment_status(): void
    {
        $this->assertSame('UNPAID', Totals::paymentStatus(1000, 0));
        $this->assertSame('PARTIAL', Totals::paymentStatus(1000, 1));
        $this->assertSame('PAID', Totals::paymentStatus(1000, 1000));
    }
}
