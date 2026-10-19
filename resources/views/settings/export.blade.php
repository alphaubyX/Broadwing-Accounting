@php
    $groups = [
        'Accounting' => [
            ['transactions.xlsx', 'spreadsheet', 'Export all transactions for Excel', 'Journal, sales, expenses, payments, purchase orders, chart of accounts and contacts, one sheet each.'],
            ['transactions.csv', 'file', 'Export all transactions as CSV', "Every debit and credit line, ready for any spreadsheet or accountant's software."],
        ],
        'Receipts' => [
            ['receipts.zip', 'receipt', 'Export all receipts as a ZIP file', $receipts.' file'.($receipts === 1 ? '' : 's').', in one folder per transaction (e.g. EXP-0001/).'],
        ],
    ];
@endphp
<x-settings title="Data export">
    <div class="space-y-6">
        <div>
            <h2 class="text-lg font-semibold text-slate-900">Export your data</h2>
            <p class="text-sm text-slate-500">Export and download data from <strong class="text-slate-700">{{ $org->name }}</strong>.</p>
        </div>
        @foreach ($groups as $group => $cards)
            <section>
                <h3 class="mb-3 text-sm font-semibold text-slate-900">{{ $group }}</h3>
                <div class="grid gap-4 lg:grid-cols-2">
                    @foreach ($cards as [$kind, $icon, $title, $detail])
                        <a href="{{ route('settings.export.download', $kind) }}" class="card flex items-center gap-5 p-6 transition hover:border-brand-500 hover:shadow">
                            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><x-icon :name="$icon" class="h-7 w-7" /></div>
                            <div><div class="text-base font-semibold text-slate-900">{{ $title }}</div><div class="mt-0.5 text-sm text-slate-500">{{ $detail }}</div></div>
                        </a>
                    @endforeach
                </div>
            </section>
        @endforeach
    </div>
</x-settings>
