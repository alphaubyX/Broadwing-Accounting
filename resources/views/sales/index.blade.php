<x-layouts.app title="Sales">
    <x-page-header title="Sales" subtitle="Invoices and cash sales.">
        <x-slot:actions><a href="{{ route('sales.create') }}" class="btn-primary"><x-icon name="plus" class="h-4 w-4" /> New sale</a></x-slot:actions>
    </x-page-header>
    <x-tabs route="sales.index" :current="$status" :tabs="['all' => 'All', 'draft' => 'Drafts', 'open' => 'Unpaid', 'paid' => 'Paid']" />
    <div class="card overflow-x-auto">
        @if ($sales->isEmpty())
            <div class="px-6 py-16 text-center text-sm text-slate-500">No sales here yet. <a href="{{ route('sales.create') }}" class="text-brand-600 hover:underline">Create your first sale</a></div>
        @else
            <table class="table">
                <thead><tr><th>Number</th><th>Date</th><th>Customer</th><th>Due</th><th>Status</th><th class="text-right">Total</th><th class="text-right">Balance due</th></tr></thead>
                <tbody>
                @foreach ($sales as $s)
                    <tr class="hover:bg-slate-50">
                        <td><a href="{{ route('sales.show', $s) }}" class="font-medium text-slate-900 hover:text-brand-600">{{ $s->number }}</a></td>
                        <td class="whitespace-nowrap text-slate-600">{{ fmt_date($s->date) }}</td>
                        <td>{!! $s->contact ? e($s->contact->name) : '<span class="text-slate-400">Walk-in</span>' !!}</td>
                        <td class="whitespace-nowrap text-slate-600">{{ $s->settlement === 'ON_TERMS' ? fmt_date($s->due_date) : '—' }}</td>
                        <td><x-status :status="display_status($s->status, $s->due_date)" /></td>
                        <td class="text-right">{{ amount($s->total) }}</td>
                        <td class="text-right font-medium">{{ $s->status === 'VOID' ? '—' : money(cents($s->total) - cents($s->amount_paid)) }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        @endif
    </div>
</x-layouts.app>
