@php $doc = \App\Support\Documents::purchaseOrder($org, $po); $open = $po->isOpen(); @endphp
<x-layouts.app :title="$po->number">
    <x-page-header :title="$po->number" :subtitle="$po->contact?->name">
        <x-slot:badge><x-status :status="$po->status" /></x-slot:badge>
        <x-slot:actions>
            @if ($open)<a href="{{ route('purchase-orders.edit', $po) }}" class="btn-secondary"><x-icon name="pencil" class="h-4 w-4" /> Edit</a>@endif
            <a href="{{ route('purchase-orders.print', $po) }}" target="_blank" class="btn-secondary"><x-icon name="printer" class="h-4 w-4" /> Print / PDF</a>
            @if ($po->status === 'DRAFT')<x-confirm-button :action="route('purchase-orders.status', $po)" :fields="['status' => 'SENT']">Mark as sent</x-confirm-button>@endif
            @if ($open)
                <x-confirm-button :action="route('purchase-orders.convert', $po)" confirm="Create a bill (expense on terms) from this purchase order?" class="btn-primary">Convert to expense</x-confirm-button>
                <x-confirm-button :action="route('purchase-orders.status', $po)" :fields="['status' => 'CANCELLED']" confirm="Cancel this purchase order?" class="btn-danger">Cancel PO</x-confirm-button>
            @endif
            @if (! $po->expense && in_array($po->status, ['DRAFT', 'CANCELLED'], true))
                <x-confirm-button :action="route('purchase-orders.destroy', $po)" method="DELETE" confirm="Delete this purchase order permanently?" class="btn-danger">Delete</x-confirm-button>
            @endif
        </x-slot:actions>
    </x-page-header>
    @if ($po->expense)
        <div class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Billed as <a href="{{ route('expenses.show', $po->expense) }}" class="font-medium underline">{{ $po->expense->number }}</a>.</div>
    @endif
    <div class="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div class="min-w-0 overflow-hidden rounded-xl border border-slate-200" data-fit><div>@include('documents.render', ['doc' => $doc])</div></div>
        <div class="space-y-6">
            <section class="card p-5 text-sm text-slate-600">Purchase orders don't affect your books. When the vendor bills you, use <strong>Convert to expense</strong> to record what you owe.</section>
            <x-attachments-panel kind="purchase-orders" :id="$po->id" :attachments="$po->attachments" />
        </div>
    </div>
</x-layouts.app>
