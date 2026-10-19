@php
    $usesRange = in_array($tab, ['pnl', 'journal'], true);
    $row = fn ($r) => '<div class="flex justify-between border-b border-slate-50 py-1.5 text-sm"><span><span class="mr-2 text-slate-400">'.e($r['account']->code).'</span>'.e($r['account']->name).'</span><span>'.e(money($r['balance'])).'</span></div>';
    $total = fn ($label, $cents, $big = false) => '<div class="flex justify-between py-2 font-semibold '.($big ? 'border-t-2 border-slate-800 text-base' : 'border-t border-slate-200 text-sm').'"><span>'.e($label).'</span><span>'.e(money($cents)).'</span></div>';
    $section = fn ($title, $rows, $sum, $label) => '<div class="mb-6"><h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">'.e($title).'</h3>'
        .($rows ? implode('', array_map($row, $rows)) : '<div class="py-1 text-sm text-slate-400">Nothing recorded</div>').$total($label, $sum).'</div>';
    $sourceUrl = fn ($e) => match ($e->source_type) { 'SALE' => route('sales.show', $e->source_id), 'EXPENSE' => route('expenses.show', $e->source_id), default => null };
@endphp
<x-layouts.app title="Reports">
    <x-page-header title="Reports" subtitle="Your books, generated automatically from every sale, expense and payment." />
    <div class="mb-4 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200">
        <div class="flex gap-1 overflow-x-auto">
            @foreach (\App\Http\Controllers\ReportController::TABS as $value => $label)
                <a href="{{ route('reports', ['tab' => $value, 'from' => $from, 'to' => $to]) }}" @class(['-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium',
                    'border-brand-500 text-brand-700' => $tab === $value, 'border-transparent text-slate-500 hover:text-slate-800' => $tab !== $value])>{{ $label }}</a>
            @endforeach
        </div>
        <form class="no-print mb-2 flex flex-wrap items-end gap-2 text-sm">
            <input type="hidden" name="tab" value="{{ $tab }}">
            @if ($usesRange)<label><span class="label text-xs">From</span><input type="date" name="from" value="{{ $from }}" class="input py-1.5"></label>@endif
            <label><span class="label text-xs">{{ $usesRange ? 'To' : 'As of' }}</span><input type="date" name="to" value="{{ $to }}" class="input py-1.5"></label>
            <button class="btn-secondary py-1.5">Update</button>
        </form>
    </div>

    <div class="card p-6">
        @if ($tab === 'pnl')
            <div class="mx-auto max-w-2xl">
                <h2 class="mb-6 text-center text-lg font-semibold">Profit & loss · {{ fmt_date($from) }} – {{ fmt_date($to) }}</h2>
                {!! $section('Income', $report['income'], $report['income_total'], 'Total income') !!}
                @if ($report['cost_of_sales'])
                    {!! $section('Cost of sales', $report['cost_of_sales'], $report['cost_of_sales_total'], 'Total cost of sales') !!}
                    <div class="mb-6">{!! $total('Gross profit', $report['gross_profit']) !!}</div>
                @endif
                {!! $section('Expenses', $report['expenses'], $report['expense_total'], 'Total expenses') !!}
                {!! $total('Net profit', $report['net_profit'], true) !!}
            </div>
        @elseif ($tab === 'balance')
            <div class="mx-auto max-w-2xl">
                <h2 class="mb-6 text-center text-lg font-semibold">Balance sheet · as of {{ fmt_date($to) }}</h2>
                {!! $section('Assets', $report['assets'], $report['asset_total'], 'Total assets') !!}
                {!! $section('Liabilities', $report['liabilities'], $report['liability_total'], 'Total liabilities') !!}
                <div class="mb-6">
                    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Equity</h3>
                    {!! implode('', array_map($row, $report['equity'])) !!}
                    <div class="flex justify-between border-b border-slate-50 py-1.5 text-sm"><span>Profit to date</span><span>{{ money($report['earnings']) }}</span></div>
                    {!! $total('Total equity', $report['equity_total']) !!}
                </div>
                {!! $total('Liabilities + equity', $report['liability_total'] + $report['equity_total'], true) !!}
                @if ($report['asset_total'] !== $report['liability_total'] + $report['equity_total'])
                    <p class="mt-2 text-sm text-red-600">Warning: the balance sheet does not balance.</p>
                @endif
            </div>
        @elseif ($tab === 'trial')
            <div class="overflow-x-auto">
                <h2 class="mb-4 text-lg font-semibold">Trial balance · as of {{ fmt_date($to) }}</h2>
                <table class="table">
                    <thead><tr><th>Account</th><th class="text-right">Debit</th><th class="text-right">Credit</th></tr></thead>
                    <tbody>
                    @foreach ($report['lines'] as $l)
                        <tr><td><span class="mr-2 text-slate-400">{{ $l['account']->code }}</span>{{ $l['account']->name }}</td>
                            <td class="text-right">{{ $l['debit'] ? money($l['debit']) : '' }}</td><td class="text-right">{{ $l['credit'] ? money($l['credit']) : '' }}</td></tr>
                    @endforeach
                    <tr class="font-semibold" data-total><td>Total</td><td class="text-right">{{ money($report['debit_total']) }}</td><td class="text-right">{{ money($report['credit_total']) }}</td></tr>
                    </tbody>
                </table>
            </div>
        @else
            @forelse ($entries as $e)
                <div class="mb-5">
                    <div class="flex justify-between text-sm">
                        <span class="font-medium">@if ($url = $sourceUrl($e))<a href="{{ $url }}" class="hover:text-brand-600">{{ $e->memo }}</a>@else{{ $e->memo }}@endif</span>
                        <span class="text-slate-500">{{ fmt_date($e->date) }}</span>
                    </div>
                    <table class="table mt-1 text-xs"><tbody>
                        @foreach ($e->lines as $l)
                            <tr><td class="py-1.5 {{ cents($l->credit) > 0 ? 'pl-10' : '' }}">{{ $l->account->label() }}</td>
                                <td class="w-32 py-1.5 text-right">{{ cents($l->debit) ? amount($l->debit) : '' }}</td><td class="w-32 py-1.5 text-right">{{ cents($l->credit) ? amount($l->credit) : '' }}</td></tr>
                        @endforeach
                    </tbody></table>
                </div>
            @empty
                <p class="text-sm text-slate-500">No journal entries in this period.</p>
            @endforelse
        @endif
    </div>
</x-layouts.app>
