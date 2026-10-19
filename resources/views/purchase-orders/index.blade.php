<x-layouts.app title="Purchase orders">
    <x-page-header title="Purchase orders" subtitle="Orders you send to vendors. Convert one to an expense when the bill arrives.">
        <x-slot:actions><a href="{{ route('purchase-orders.create') }}" class="btn-primary"><x-icon name="plus" class="h-4 w-4" /> New purchase order</a></x-slot:actions>
    </x-page-header>
    <x-tabs route="purchase-orders.index" :current="$status" :tabs="['all' => 'All', 'open' => 'Open', 'billed' => 'Billed']" />
    <div class="card overflow-x-auto">
        @if ($orders->isEmpty())
            <div class="px-6 py-16 text-center text-sm text-slate-500">No purchase orders yet. <a href="{{ route('purchase-orders.create') }}" class="text-brand-600 hover:underline">Create one</a></div>
        @else
            <table class="table">
                <thead><tr><th>Number</th><th>Date</th><th>Vendor</th><th>Delivery by</th><th>Status</th><th class="text-right">Total</th></tr></thead>
                <tbody>
                @foreach ($orders as $p)
                    <tr class="hover:bg-slate-50">
                        <td><a href="{{ route('purchase-orders.show', $p) }}" class="font-medium text-slate-900 hover:text-brand-600">{{ $p->number }}</a></td>
                        <td class="whitespace-nowrap text-slate-600">{{ fmt_date($p->date) }}</td>
                        <td>{{ $p->contact?->name }}</td>
                        <td class="whitespace-nowrap text-slate-600">{{ fmt_date($p->expected_date) }}</td>
                        <td><x-status :status="$p->status" /></td>
                        <td class="text-right font-medium">{{ amount($p->total) }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        @endif
    </div>
</x-layouts.app>
