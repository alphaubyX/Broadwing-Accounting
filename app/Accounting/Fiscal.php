<?php

namespace App\Accounting;

final class Fiscal
{
    public const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    /** Days in a month, using a leap year so 29 February can be chosen as a year end. */
    public static function daysInMonth(int $month): int
    {
        return (int) date('t', mktime(0, 0, 0, $month, 1, 2000));
    }

    private static function yearEnd(int $year, int $month, int $day): string
    {
        $last = (int) date('t', mktime(0, 0, 0, $month, 1, $year));

        return sprintf('%04d-%02d-%02d', $year, $month, min($day, $last));
    }

    /** @return array{from: string, to: string} the fiscal year containing $dateIso */
    public static function year(string $dateIso, int $endMonth, int $endDay): array
    {
        $year = (int) substr($dateIso, 0, 4);
        $thisEnd = self::yearEnd($year, $endMonth, $endDay);
        $to = $dateIso <= $thisEnd ? $thisEnd : self::yearEnd($year + 1, $endMonth, $endDay);
        $previousEnd = self::yearEnd((int) substr($to, 0, 4) - 1, $endMonth, $endDay);

        return ['from' => date('Y-m-d', strtotime($previousEnd.' +1 day')), 'to' => $to];
    }
}
