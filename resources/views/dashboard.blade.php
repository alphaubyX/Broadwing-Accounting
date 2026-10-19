<x-layouts.app title="Dashboard">
    <x-page-header title="Dashboard" :subtitle="'Here\'s how '.$org->name.' is doing.'">
        <x-slot:actions>
            <a href="{{ route('expenses.create') }}" class="btn-secondary"><x-icon name="plus" class="h-4 w-4" /> Expense</a>
            <a href="{{ route('sales.create') }}" class="btn-primary"><x-icon name="plus" class="h-4 w-4" /> Sale</a>
        </x-slot:actions>
    </x-page-header>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @foreach ([
            ['bank', 'Cash & bank', $cashTotal, null, 'text-slate-500'],
            ['in', 'Owed to you', $owedToYou, route('sales.index', ['status' => 'open']), 'text-emerald-600'],
            ['out', 'You owe', $youOwe, route('expenses.index', ['status' => 'open']), 'text-amber-600'],
            ['chart', 'Profit this fiscal year', $year['net_profit'], route('reports'), 'text-slate-500'],
        ] as [$icon, $label, $value, $href, $color])
            <a @if ($href) href="{{ $href }}" @endif class="card block p-5 transition hover:border-slate-300">
                <div class="flex items-center gap-2 text-sm text-slate-500"><x-icon :name="$icon" class="h-5 w-5 {{ $color }}" />{{ $label }}</div>
                <div class="mt-2 text-2xl font-semibold text-slate-900">{{ money($value) }}</div>
            </a>
        @endforeach
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <div class="card p-5">
            <h2 class="text-sm font-semibold text-slate-900">This month</h2>
            <dl class="mt-4 space-y-3 text-sm">
                <div class="flex justify-between"><dt class="text-slate-500">Income</dt><dd>{{ money($month['income_total']) }}</dd></div>
                <div class="flex justify-between"><dt class="text-slate-500">Expenses</dt><dd>{{ money($month['cost_of_sales_total'] + $month['expense_total']) }}</dd></div>
                <div class="flex justify-between border-t border-slate-100 pt-3 font-semibold text-slate-900"><dt>Net profit</dt><dd>{{ money($month['net_profit']) }}</dd></div>
            </dl>
            <h3 class="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Bank & cash accounts</h3>
            <ul class="mt-2 space-y-2 text-sm">
                @foreach ($cash as $b)
                    <li class="flex justify-between"><span class="text-slate-600">{{ $b['account']->name }}</span><span>{{ money($b['balance']) }}</span></li>
                @endforeach
            </ul>
        </div>
        <div class="card lg:col-span-2">
            <h2 class="px-5 pt-5 text-sm font-semibold text-slate-900">Recent transactions</h2>
            @if ($recent->isEmpty())
                <p class="px-5 py-10 text-center text-sm text-slate-500">No transactions yet. Record your first sale or expense.</p>
            @else
                <table class="table mt-2"><tbody>
                    @foreach ($recent as $r)
                        <tr class="hover:bg-slate-50">
                            <td class="w-28 text-slate-500">{{ fmt_date($r['date']) }}</td>
                            <td><a href="{{ $r['url'] }}" class="font-medium text-slate-900 hover:text-brand-600">{{ $r['number'] }}</a><div class="text-xs text-slate-500">{{ $r['who'] }}</div></td>
                            <td><x-status :status="$r['status']" /></td>
                            <td class="text-right font-medium {{ $r['kind'] === 'Sale' ? 'text-emerald-700' : 'text-slate-900' }}">{{ $r['kind'] === 'Sale' ? '+' : '−' }}{{ amount($r['total']) }}</td>
                        </tr>
                    @endforeach
                </tbody></table>
            @endif
        </div>
    </div>
</x-layouts.app>
