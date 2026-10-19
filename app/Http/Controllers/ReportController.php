<?php

namespace App\Http\Controllers;

use App\Accounting\Fiscal;
use App\Accounting\Reports;
use App\Models\JournalEntry;
use App\Support\CurrentOrganization;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public const TABS = ['pnl' => 'Profit & loss', 'balance' => 'Balance sheet', 'trial' => 'Trial balance', 'journal' => 'Journal'];

    public function __invoke(Request $request)
    {
        $org = CurrentOrganization::require();
        $tab = array_key_exists($request->query('tab'), self::TABS) ? $request->query('tab') : 'pnl';
        $valid = fn ($d) => is_string($d) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) ? $d : null;
        $to = $valid($request->query('to')) ?? today()->toDateString();
        $from = $valid($request->query('from')) ?? Fiscal::year($to, $org->fiscal_year_end_month, $org->fiscal_year_end_day)['from'];

        $data = match ($tab) {
            'pnl' => ['report' => Reports::profitAndLoss($org->id, $from, $to)],
            'balance' => ['report' => Reports::balanceSheet($org->id, $to)],
            'trial' => ['report' => Reports::trialBalance($org->id, $to)],
            'journal' => ['entries' => JournalEntry::with('lines.account')->where('organization_id', $org->id)
                ->whereBetween('date', [$from, $to])->latest('date')->latest('id')->limit(300)->get()],
        };

        return view('reports.index', $data + compact('tab', 'from', 'to'));
    }
}
