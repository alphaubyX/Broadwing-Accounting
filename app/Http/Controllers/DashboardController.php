<?php

namespace App\Http\Controllers;

use App\Accounting\Fiscal;
use App\Accounting\Reports;
use App\Models\Expense;
use App\Models\Sale;
use App\Support\CurrentOrganization;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $org = CurrentOrganization::require();
        $today = today()->toDateString();
        $year = Fiscal::year($today, $org->fiscal_year_end_month, $org->fiscal_year_end_day);
        $balances = Reports::balances($org->id, null, $today);
        $cash = array_values(array_filter($balances, fn ($b) => $b['account']->subtype === 'CASH_AND_BANK'));
        $outstanding = fn ($q) => $q->where('organization_id', $org->id)->whereIn('status', ['UNPAID', 'PARTIAL'])->get()
            ->sum(fn ($d) => cents($d->total) - cents($d->amount_paid));

        $recent = Sale::with('contact')->where('organization_id', $org->id)->latest('date')->latest('id')->take(6)->get()
            ->map(fn (Sale $s) => ['kind' => 'Sale', 'url' => route('sales.show', $s), 'number' => $s->number, 'date' => $s->date,
                'who' => $s->contact?->name ?? 'Walk-in', 'total' => $s->total, 'status' => display_status($s->status, $s->due_date), 'id' => $s->created_at])
            ->concat(Expense::with('contact')->where('organization_id', $org->id)->latest('date')->latest('id')->take(6)->get()
                ->map(fn (Expense $e) => ['kind' => 'Expense', 'url' => route('expenses.show', $e), 'number' => $e->number, 'date' => $e->date,
                    'who' => $e->payee() ?? $e->description, 'total' => $e->total, 'status' => display_status($e->status, $e->due_date), 'id' => $e->created_at]))
            ->sortByDesc(fn ($r) => [$r['date']->timestamp, $r['id']?->timestamp])->take(8)->values();

        return view('dashboard', [
            'cash' => $cash,
            'cashTotal' => array_sum(array_column($cash, 'balance')),
            'owedToYou' => $outstanding(Sale::query()),
            'youOwe' => $outstanding(Expense::query()),
            'month' => Reports::profitAndLoss($org->id, today()->startOfMonth()->toDateString(), $today),
            'year' => Reports::profitAndLoss($org->id, $year['from'], $today),
            'recent' => $recent,
        ]);
    }
}
