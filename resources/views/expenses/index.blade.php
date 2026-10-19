<x-layouts.app title="Expenses">
    <x-page-header title="Expenses" subtitle="Everything you buy: cash purchases, card spend and bills on payment terms.">
        <x-slot:actions><a href="{{ route('expenses.create') }}" class="btn-primary"><x-icon name="plus" class="h-4 w-4" /> New expense</a></x-slot:actions>
    </x-page-header>
    <x-tabs route="expenses.index" :current="$status" :tabs="['all' => 'All', 'open' => 'To pay', 'paid' => 'Paid', 'noreceipt' => 'Missing receipt']" />
    <div class="card overflow-x-auto">
        @if ($expenses->isEmpty())
            <div class="px-6 py-16 text-center text-sm text-slate-500"><x-icon name="camera" class="mx-auto mb-3 h-8 w-8 text-slate-300" />No expenses here. <a href="{{ route('expenses.create') }}" class="text-brand-600 hover:underline">Record an expense</a></div>
        @else
            <table class="table">
                <thead><tr><th>Number</th><th>Date</th><th>Paid to</th><th>Description</th><th>Category</th><th>Status</th><th class="text-right">Total</th></tr></thead>
                <tbody>
                @foreach ($expenses as $e)
                    @php $cats = $e->lines->pluck('account.name')->unique(); @endphp
                    <tr class="hover:bg-slate-50">
                        <td class="whitespace-nowrap"><a href="{{ route('expenses.show', $e) }}" class="font-medium text-slate-900 hover:text-brand-600">{{ $e->number }}</a>
                            @if ($e->attachments_count)<x-icon name="paperclip" class="ml-1 inline h-3.5 w-3.5 text-slate-400" />@endif</td>
                        <td class="whitespace-nowrap text-slate-600">{{ fmt_date($e->date) }}</td>
                        <td>{{ $e->payee() ?? '—' }}</td>
                        <td class="max-w-[240px] truncate text-slate-600">{{ $e->description }}</td>
                        <td class="text-slate-600">{{ $cats->count() > 1 ? 'Split' : $cats->first() }}</td>
                        <td><x-status :status="display_status($e->status, $e->due_date)" /></td>
                        <td class="text-right font-medium">{{ amount($e->total) }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        @endif
    </div>
</x-layouts.app>
