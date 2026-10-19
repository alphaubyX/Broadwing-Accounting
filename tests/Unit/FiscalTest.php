<?php

namespace Tests\Unit;

use App\Accounting\Fiscal;
use PHPUnit\Framework\TestCase;

class FiscalTest extends TestCase
{
    public function test_calendar_year(): void
    {
        $this->assertSame(['from' => '2026-01-01', 'to' => '2026-12-31'], Fiscal::year('2026-10-09', 12, 31));
    }

    public function test_june_year_end(): void
    {
        $this->assertSame(['from' => '2026-07-01', 'to' => '2027-06-30'], Fiscal::year('2026-10-09', 6, 30));
        $this->assertSame(['from' => '2025-07-01', 'to' => '2026-06-30'], Fiscal::year('2026-03-01', 6, 30));
        $this->assertSame(['from' => '2025-07-01', 'to' => '2026-06-30'], Fiscal::year('2026-06-30', 6, 30));
    }

    public function test_29_february_is_clamped_in_non_leap_years(): void
    {
        $this->assertSame(['from' => '2026-03-01', 'to' => '2027-02-28'], Fiscal::year('2027-01-10', 2, 29));
        $this->assertSame(29, Fiscal::daysInMonth(2));
    }
}
