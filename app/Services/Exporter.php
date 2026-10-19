<?php

namespace App\Services;

use App\Accounting\Money;
use App\Models\Account;
use App\Models\Attachment;
use App\Models\Contact;
use App\Models\Expense;
use App\Models\JournalLine;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\PurchaseOrder;
use App\Models\Sale;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use ZipArchive;

/** Data export: all transactions for Excel, as CSV, and all receipts as a ZIP. */
final class Exporter
{
    private static function amount(mixed $v): float
    {
        return Money::toCents($v) / 100;
    }

    /** Every journal line: the complete accounting record. */
    private static function journal(Organization $org): array
    {
        $rows = JournalLine::query()
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
            ->where('journal_entries.organization_id', $org->id)
            ->orderBy('journal_entries.date')->orderBy('journal_entries.id')->orderByDesc('journal_lines.debit')
            ->get(['journal_entries.date', 'journal_entries.source_number', 'journal_entries.source_type', 'journal_entries.memo',
                'accounts.code', 'accounts.name', 'accounts.type', 'journal_lines.debit', 'journal_lines.credit']);

        return [
            'name' => 'All transactions',
            'headers' => ['Date', 'Transaction', 'Type', 'Description', 'Account code', 'Account', 'Account type', 'Debit', 'Credit'],
            'money' => [7, 8],
            'rows' => $rows->map(fn ($r) => [
                substr((string) $r->date, 0, 10), $r->source_number, $r->source_type, $r->memo, $r->code, $r->name, $r->type,
                self::amount($r->debit) ?: null, self::amount($r->credit) ?: null,
            ])->all(),
        ];
    }

    private static function sheets(Organization $org): array
    {
        $id = $org->id;

        return [
            self::journal($org),
            [
                'name' => 'Sales', 'money' => [5, 6, 7, 8],
                'headers' => ['Number', 'Date', 'Due', 'Customer', 'Status', 'Subtotal', 'Tax', 'Total', 'Paid'],
                'rows' => Sale::with('contact')->where('organization_id', $id)->orderBy('date')->get()->map(fn ($s) => [
                    $s->number, $s->date->toDateString(), $s->due_date?->toDateString(), $s->contact?->name, $s->status,
                    self::amount($s->subtotal), self::amount($s->tax_total), self::amount($s->total), self::amount($s->amount_paid),
                ])->all(),
            ],
            [
                'name' => 'Expenses', 'money' => [6, 7, 8, 9],
                'headers' => ['Number', 'Date', 'Paid to', 'Description', 'Categories', 'Status', 'Subtotal', 'Tax', 'Total', 'Paid'],
                'rows' => Expense::with(['contact', 'lines.account'])->where('organization_id', $id)->orderBy('date')->get()->map(fn ($e) => [
                    $e->number, $e->date->toDateString(), $e->payee(), $e->description, $e->lines->pluck('account.name')->unique()->implode(', '), $e->status,
                    self::amount($e->subtotal), self::amount($e->tax_total), self::amount($e->total), self::amount($e->amount_paid),
                ])->all(),
            ],
            [
                'name' => 'Payments', 'money' => [7],
                'headers' => ['Number', 'Date', 'For', 'Direction', 'Account', 'Method', 'Reference', 'Amount'],
                'rows' => Payment::with(['account', 'sale', 'expense'])->where('organization_id', $id)->orderBy('date')->get()->map(fn ($p) => [
                    $p->number, $p->date->toDateString(), $p->sale?->number ?? $p->expense?->number, $p->sale_id ? 'Received' : 'Paid',
                    $p->account->name, $p->method, $p->reference, self::amount($p->amount),
                ])->all(),
            ],
            [
                'name' => 'Purchase orders', 'money' => [4],
                'headers' => ['Number', 'Date', 'Vendor', 'Status', 'Total'],
                'rows' => PurchaseOrder::with('contact')->where('organization_id', $id)->orderBy('date')->get()->map(fn ($p) => [
                    $p->number, $p->date->toDateString(), $p->contact?->name, $p->status, self::amount($p->total),
                ])->all(),
            ],
            [
                'name' => 'Chart of accounts', 'money' => [],
                'headers' => ['Code', 'Name', 'Type', 'Detail type', 'Archived'],
                'rows' => Account::where('organization_id', $id)->orderBy('code')->get()->map(fn ($a) => [$a->code, $a->name, $a->type, $a->subtype, $a->is_archived ? 'Yes' : 'No'])->all(),
            ],
            [
                'name' => 'Contacts', 'money' => [],
                'headers' => ['Name', 'Type', 'Email', 'Phone', 'Tax number'],
                'rows' => Contact::where('organization_id', $id)->orderBy('name')->get()->map(fn ($c) => [$c->name, $c->type, $c->email, $c->phone, $c->tax_number])->all(),
            ],
        ];
    }

    /** @return string path of a temporary .xlsx file */
    public static function workbook(Organization $org): string
    {
        $book = new Spreadsheet;
        $book->getProperties()->setCreator('Broadwing Accounting')->setTitle($org->name.' transactions');
        $book->removeSheetByIndex(0);
        foreach (self::sheets($org) as $i => $sheet) {
            $ws = $book->createSheet($i);
            $ws->setTitle($sheet['name']);
            $headers = array_map(fn ($h, $col) => in_array($col, $sheet['money'], true) ? "{$h} ({$org->currency})" : $h, $sheet['headers'], array_keys($sheet['headers']));
            $ws->fromArray([$headers, ...$sheet['rows']], null, 'A1', true);
            $ws->getStyle('1:1')->getFont()->setBold(true);
            $ws->freezePane('A2');
            foreach ($sheet['money'] as $col) {
                $letter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col + 1);
                $ws->getStyle("{$letter}2:{$letter}".(count($sheet['rows']) + 1))->getNumberFormat()->setFormatCode('#,##0.00');
            }
            foreach (range(1, count($headers)) as $col) {
                $ws->getColumnDimensionByColumn($col)->setAutoSize(true);
            }
        }
        $book->setActiveSheetIndex(0);
        $path = tempnam(sys_get_temp_dir(), 'bw').'.xlsx';
        (new Xlsx($book))->save($path);

        return $path;
    }

    /** Spreadsheet apps execute cells starting with these characters as formulas. */
    private static function csvCell(mixed $v): string
    {
        if ($v === null) {
            return '';
        }
        if (is_int($v) || is_float($v)) {
            return (string) $v;
        }
        $v = (string) $v;
        if (preg_match('/^[=+\-@\t\r]/', $v)) {
            $v = "'".$v;
        }

        return preg_match('/[",\n\r]/', $v) ? '"'.str_replace('"', '""', $v).'"' : $v;
    }

    public static function csv(Organization $org): string
    {
        $sheet = self::journal($org);
        $lines = array_map(fn ($r) => implode(',', array_map([self::class, 'csvCell'], $r)), [$sheet['headers'], ...$sheet['rows']]);

        return "\u{FEFF}".implode("\r\n", $lines)."\r\n"; // BOM so Excel reads UTF-8
    }

    /** @return string path of a temporary .zip with one folder per transaction */
    public static function receipts(Organization $org): string
    {
        $path = tempnam(sys_get_temp_dir(), 'bw').'.zip';
        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $used = [];
        foreach (Attachment::with(['sale', 'expense', 'purchaseOrder'])->where('organization_id', $org->id)->orderBy('id')->get() as $a) {
            if (! Storage::disk('local')->exists($a->storage_path)) {
                continue;
            }
            $folder = $a->expense?->number ?? $a->sale?->number ?? $a->purchaseOrder?->number ?? 'Other';
            $name = preg_replace('/[\\\\\/:*?"<>|]/', '_', $a->file_name);
            $entry = "{$folder}/{$name}";
            for ($i = 2; isset($used[$entry]); $i++) {
                $entry = "{$folder}/{$i}-{$name}";
            }
            $used[$entry] = true;
            $zip->addFile(Storage::disk('local')->path($a->storage_path), $entry);
        }
        if (! $used) {
            $zip->addFromString('README.txt', 'No receipts or attachments have been uploaded yet.');
        }
        $zip->close();

        return $path;
    }
}
