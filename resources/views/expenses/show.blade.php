@php $due = cents($expense->total) - cents($expense->amount_paid); @endphp
<x-layouts.app :title="$expense->number">
    <x-page-header :title="$expense->number" :subtitle="$expense->description">
        <x-slot:badge><x-status :status="display_status($expense->status, $expense->due_date)" /></x-slot:badge>
        <x-slot:actions>
            <a href="{{ route('expenses.edit', $expense) }}" class="btn-secondary"><x-icon name="pencil" class="h-4 w-4" /> Edit</a>
            <x-confirm-button :action="route('expenses.destroy', $expense)" method="DELETE" confirm="Delete this expense and its payments?" class="btn-danger">Delete</x-confirm-button>
        </x-slot:actions>
    </x-page-header>
    <div class="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div class="space-y-6">
            <section class="card p-6">
                <dl class="grid gap-4 text-sm sm:grid-cols-3">
                    @foreach (array_filter([
                        'Date' => fmt_date($expense->date),
                        'Paid to' => $expense->payee() ?? '—',
                        'Receipt / bill no.' => $expense->reference ?? '—',
                        $expense->settlement === 'PAID_NOW' ? 'Paid from' : 'Due date' => $expense->settlement === 'PAID_NOW' ? ($expense->paidFromAccount?->name ?? '—') : fmt_date($expense->due_date),
                    ]) as $label => $value)
                        <div><dt class="text-xs uppercase tracking-wide text-slate-500">{{ $label }}</dt><dd class="mt-0.5 font-medium text-slate-900">{{ $value }}</dd></div>
                    @endforeach
                    @if ($expense->purchaseOrder)
                        <div><dt class="text-xs uppercase tracking-wide text-slate-500">Purchase order</dt><dd class="mt-0.5 font-medium"><a href="{{ route('purchase-orders.show', $expense->purchaseOrder) }}" class="text-brand-600 hover:underline">{{ $expense->purchaseOrder->number }}</a></dd></div>
                    @endif
                </dl>
                <div class="overflow-x-auto">
                <table class="table mt-6">
                    <thead><tr><th class="px-0">Description</th><th>Category</th><th>Tax</th><th class="pr-0 text-right">Amount</th></tr></thead>
                    <tbody>
                    @foreach ($expense->lines as $l)
                        <tr>
                            <td class="px-0">{{ $l->description }}</td>
                            <td class="text-slate-600">{{ $l->account->name }}</td>
                            <td class="text-slate-600">{{ $l->tax ? $l->tax->abbreviation.' '.amount($l->tax_amount).($l->tax->is_recoverable ? '' : ' (not recoverable)') : '—' }}</td>
                            <td class="pr-0 text-right">{{ amount($l->amount) }}</td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
                </div>
                <dl class="ml-auto mt-4 w-60 space-y-1 text-sm">
                    <div class="flex justify-between"><dt class="text-slate-500">Subtotal</dt><dd>{{ amount($expense->subtotal) }}</dd></div>
                    <div class="flex justify-between"><dt class="text-slate-500">Tax</dt><dd>{{ amount($expense->tax_total) }}</dd></div>
                    <div class="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold"><dt>Total</dt><dd>{{ amount($expense->total) }}</dd></div>
                </dl>
            </section>
            <x-attachments-panel kind="expenses" :id="$expense->id" :attachments="$expense->attachments" />
        </div>
        <div class="space-y-6">
            <section class="card p-5">
                <dl class="space-y-2 text-sm">
                    <div class="flex justify-between"><dt class="text-slate-500">Total</dt><dd class="font-medium">{{ amount($expense->total) }}</dd></div>
                    <div class="flex justify-between"><dt class="text-slate-500">Paid</dt><dd>{{ amount($expense->amount_paid) }}</dd></div>
                    <div class="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold"><dt>Still to pay</dt><dd>{{ money($due) }}</dd></div>
                </dl>
            </section>
            @if ($expense->settlement === 'ON_TERMS')
                <x-payments-panel kind="expenses" :doc="$expense" :accounts="$payFrom" :default-account="$defaultBankId" account-label="Paid from" />
            @endif
            <x-journal-panel :sources="[['EXPENSE', $expense->id], ...$expense->payments->map(fn ($p) => ['PAYMENT', $p->id])->all()]" />
        </div>
    </div>
</x-layouts.app>
