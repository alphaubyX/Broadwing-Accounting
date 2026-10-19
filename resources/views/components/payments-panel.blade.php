@props(['kind', 'doc', 'accounts', 'defaultAccount', 'accountLabel'])
@php $due = cents($doc->total) - cents($doc->amount_paid); @endphp
<section class="card space-y-4 p-5">
    <h2 class="text-sm font-semibold text-slate-900">{{ $kind === 'sales' ? 'Payments received' : 'Payments made' }}</h2>
    @forelse ($doc->payments as $p)
        <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 text-sm last:border-0">
            <div>
                <div class="font-medium">{{ $p->number }} · {{ amount($p->amount) }}</div>
                <div class="text-xs text-slate-500">{{ fmt_date($p->date) }} · {{ $p->account->name }}{{ $p->method ? ' · '.$p->method : '' }}{{ $p->reference ? ' · '.$p->reference : '' }}</div>
            </div>
            <x-confirm-button :action="route('payments.destroy', $p->id)" method="DELETE" confirm="Delete this payment?" class="btn-ghost text-xs">Remove</x-confirm-button>
        </div>
    @empty
        <p class="text-sm text-slate-500">No payments recorded yet.</p>
    @endforelse
    @if ($due > 0)
        <form method="POST" action="{{ route('payments.store', [$kind, $doc->id]) }}" class="space-y-3 border-t border-slate-100 pt-4">
            @csrf
            <div class="grid gap-3 sm:grid-cols-2">
                <x-field label="Date"><input type="date" name="date" value="{{ old('date', today()->toDateString()) }}" class="input" required></x-field>
                <x-field label="Amount" name="amount"><input name="amount" value="{{ old('amount', number_format($due / 100, 2, '.', '')) }}" inputmode="decimal" class="input" required></x-field>
                <x-field :label="$accountLabel"><x-select name="account_id" :options="$accounts" :selected="$defaultAccount" /></x-field>
                <x-field label="Method"><x-select name="method" :options="array_combine($m = ['Bank transfer', 'Cash', 'Card', 'Cheque', 'Other'], $m)" selected="Bank transfer" /></x-field>
            </div>
            <x-field label="Reference"><input name="reference" class="input" placeholder="Optional"></x-field>
            <button class="btn-primary">Record payment</button>
        </form>
    @endif
</section>
