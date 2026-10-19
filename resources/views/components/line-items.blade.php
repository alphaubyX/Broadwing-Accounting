@props(['lines', 'accounts', 'taxes', 'defaultAccount', 'mode' => 'items', 'accountLabel' => 'Account'])
{{-- Line items: "items" = description, account, qty, price, tax (sales & POs); "amounts" = description, category, amount, tax (expenses). --}}
@php
    $grid = $mode === 'items'
        ? 'sm:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_70px_110px_minmax(0,1fr)_120px_36px]'
        : 'sm:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_120px_minmax(0,1fr)_120px_36px]';
    $accountOptions = collect($accounts)->map(fn ($label, $id) => ['id' => (string) $id, 'label' => $label])->values();
@endphp
<div x-data="lineItems({ lines: @js(array_values($lines)), taxes: @js($taxes), defaultAccount: @js((string) $defaultAccount), mode: @js($mode), currency: @js($org->currency) })">
    <div class="divide-y divide-slate-100 rounded-lg border border-slate-200">
        <div class="{{ $grid }} hidden gap-2 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <span>Description</span><span>{{ $accountLabel }}</span>
            @if ($mode === 'items')<span>Qty</span><span>Price</span>@else<span>Amount</span>@endif
            <span>Tax</span><span class="text-right">Total</span><span></span>
        </div>
        <template x-for="(l, i) in lines" :key="i">
            <div class="{{ $grid }} grid grid-cols-2 items-start gap-2 px-3 py-3" data-line>
                <input class="input col-span-2 sm:col-span-1" aria-label="Description" :name="`lines[${i}][description]`" x-model="l.description"
                       placeholder="{{ $mode === 'items' ? 'Item or service' : 'What was it for? (optional)' }}">
                <select class="input col-span-2 sm:col-span-1" aria-label="{{ $accountLabel }}" :name="`lines[${i}][account_id]`" x-model="l.account_id">
                    @foreach ($accountOptions as $o)<option value="{{ $o['id'] }}">{{ $o['label'] }}</option>@endforeach
                </select>
                @if ($mode === 'items')
                    <input class="input" aria-label="Quantity" inputmode="decimal" :name="`lines[${i}][quantity]`" x-model="l.quantity">
                @else
                    <input type="hidden" :name="`lines[${i}][quantity]`" value="1">
                @endif
                <input class="input" aria-label="{{ $mode === 'items' ? 'Price' : 'Amount' }}" inputmode="decimal" placeholder="{{ $mode === 'items' ? 'Price' : 'Amount' }}"
                       :name="`lines[${i}][unit_price]`" x-model="l.unit_price">
                <select class="input" aria-label="Tax" :name="`lines[${i}][tax_id]`" x-model="l.tax_id">
                    <option value="">No tax</option>
                    <template x-for="t in taxes" :key="t.id"><option :value="String(t.id)" x-text="t.label" :selected="String(t.id) === String(l.tax_id)"></option></template>
                </select>
                <div class="self-center whitespace-nowrap text-right text-sm font-medium" x-text="money(amount(l))"></div>
                <div class="self-center text-right">
                    <button type="button" class="btn-ghost px-2" x-show="lines.length > 1" @click="remove(i)" aria-label="Remove line"><x-icon name="trash" class="h-4 w-4" /></button>
                </div>
            </div>
        </template>
    </div>
    <div class="mt-3 flex flex-wrap items-start justify-between gap-4">
        <button type="button" class="btn-secondary" @click="add()"><x-icon name="plus" class="h-4 w-4" /> {{ $mode === 'items' ? 'Add line' : 'Split into another category' }}</button>
        <dl class="min-w-[220px] space-y-1 text-sm">
            <div class="flex justify-between gap-8"><dt class="text-slate-500">Subtotal</dt><dd x-text="money(subtotal)"></dd></div>
            <div class="flex justify-between gap-8"><dt class="text-slate-500">Tax</dt><dd x-text="money(taxTotal)"></dd></div>
            <div class="flex justify-between gap-8 border-t border-slate-200 pt-1 text-base font-semibold"><dt>Total</dt><dd x-text="money(subtotal + taxTotal)"></dd></div>
        </dl>
    </div>
</div>
