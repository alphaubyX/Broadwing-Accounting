@php
    $due = cents($sale->total) - cents($sale->amount_paid);
    $posted = ! in_array($sale->status, ['DRAFT', 'VOID'], true);
    $doc = \App\Support\Documents::sale($org, $sale);
@endphp
<x-layouts.app :title="$sale->number">
    <x-page-header :title="$sale->number" :subtitle="$sale->contact?->name ?? 'Walk-in customer'">
        <x-slot:badge><x-status :status="display_status($sale->status, $sale->due_date)" /></x-slot:badge>
        <x-slot:actions>
            @if ($sale->status !== 'VOID')<a href="{{ route('sales.edit', $sale) }}" class="btn-secondary"><x-icon name="pencil" class="h-4 w-4" /> Edit</a>@endif
            <a href="{{ route('sales.print', $sale) }}" target="_blank" class="btn-secondary"><x-icon name="printer" class="h-4 w-4" /> Print / PDF</a>
            @if ($sale->status === 'DRAFT')<x-confirm-button :action="route('sales.approve', $sale)" class="btn-primary">Approve</x-confirm-button>@endif
            @if ($posted)<x-confirm-button :action="route('sales.void', $sale)" confirm="Void this sale? It will be removed from your books." class="btn-danger">Void</x-confirm-button>@endif
            @unless ($posted)<x-confirm-button :action="route('sales.destroy', $sale)" method="DELETE" confirm="Delete this sale permanently?" class="btn-danger">Delete</x-confirm-button>@endunless
        </x-slot:actions>
    </x-page-header>

    <div class="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div class="min-w-0 overflow-hidden rounded-xl border border-slate-200" data-fit><div>@include('documents.render', ['doc' => $doc])</div></div>
        <div class="space-y-6">
            <section class="card p-5">
                <dl class="space-y-2 text-sm">
                    <div class="flex justify-between"><dt class="text-slate-500">Total</dt><dd class="font-medium">{{ amount($sale->total) }}</dd></div>
                    <div class="flex justify-between"><dt class="text-slate-500">Paid</dt><dd>{{ amount($sale->amount_paid) }}</dd></div>
                    <div class="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold"><dt>Balance due</dt><dd>{{ $sale->status === 'VOID' ? '—' : money($due) }}</dd></div>
                </dl>
                @if ($sale->settlement === 'PAID_NOW' && $sale->paidIntoAccount)
                    <p class="mt-3 text-xs text-slate-500">Paid on the sale date into {{ $sale->paidIntoAccount->name }}.</p>
                @endif
            </section>
            @if ($sale->settlement === 'ON_TERMS' && $posted)
                <x-payments-panel kind="sales" :doc="$sale" :accounts="$bankAccounts" :default-account="$defaultBankId" account-label="Deposited to" />
            @endif
            <x-attachments-panel kind="sales" :id="$sale->id" :attachments="$sale->attachments" />
            <x-journal-panel :sources="[['SALE', $sale->id], ...$sale->payments->map(fn ($p) => ['PAYMENT', $p->id])->all()]" />
        </div>
    </div>
</x-layouts.app>
