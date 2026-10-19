@php
    $isNew = ! $sale->exists;
    $canDraft = $isNew || $sale->status === 'DRAFT';
    $lines = old('lines') ?? ($isNew ? [] : \App\Support\Options::editableLines($sale->lines, true));
    $date = old('date', $sale->date?->toDateString() ?? today()->toDateString());
    $terms = $org->default_payment_terms;
@endphp
<x-layouts.app :title="$isNew ? 'New sale' : 'Edit '.$sale->number">
    <x-page-header :title="$isNew ? 'New sale' : 'Edit '.$sale->number" :subtitle="$isNew ? 'Create an invoice, or record a sale you\'ve already been paid for.' : null" />
    <form method="POST" action="{{ $isNew ? route('sales.store') : route('sales.update', $sale) }}" enctype="multipart/form-data" class="space-y-6"
          x-data="{ settlement: @js(old('settlement', $sale->settlement ?? 'ON_TERMS')), date: @js($date),
                    due: @js(old('due_date', $sale->due_date?->toDateString() ?? \Illuminate\Support\Carbon::parse($date)->addDays($terms)->toDateString())),
                    terms: {{ $terms }},
                    setDate(v) { this.date = v; const d = new Date(v + 'T00:00:00Z'); if (!isNaN(d)) { d.setUTCDate(d.getUTCDate() + this.terms); this.due = d.toISOString().slice(0, 10) } } }">
        @csrf
        @unless ($isNew) @method('PUT') @endunless
        <input type="hidden" name="settlement" :value="settlement">
        <div class="card space-y-5 p-6">
            <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
                <button type="button" @click="settlement = 'ON_TERMS'" :class="settlement === 'ON_TERMS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'" class="rounded-md px-3 py-1.5 font-medium">Invoice — customer pays later</button>
                <button type="button" @click="settlement = 'PAID_NOW'" :class="settlement === 'PAID_NOW' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'" class="rounded-md px-3 py-1.5 font-medium">Paid now (cash sale)</button>
            </div>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <x-field label="Customer" name="contact_id" class="sm:col-span-2">
                    <select name="contact_id" class="input">
                        <option value="" x-text="settlement === 'PAID_NOW' ? 'Walk-in customer' : 'Choose a customer…'"></option>
                        @foreach ($customers as $id => $name)<option value="{{ $id }}" @selected((string) old('contact_id', $sale->contact_id) === (string) $id)>{{ $name }}</option>@endforeach
                    </select>
                    <span class="hint"><a href="{{ route('contacts.create', ['type' => 'CUSTOMER']) }}" target="_blank" class="text-brand-600 hover:underline">+ New customer</a> (then reload this page)</span>
                </x-field>
                <x-field label="Date" name="date"><input type="date" name="date" :value="date" @change="setDate($event.target.value)" class="input" required></x-field>
                <div x-show="settlement === 'ON_TERMS'">
                    <x-field label="Due date" :hint="'Default terms: '.$terms.' days'"><input type="date" name="due_date" x-model="due" class="input"></x-field>
                </div>
                <div x-show="settlement === 'PAID_NOW'" x-cloak>
                    <x-field label="Deposited to" name="paid_into_account_id"><x-select name="paid_into_account_id" :options="$depositAccounts" :selected="$sale->paid_into_account_id ?? $defaultBankId" /></x-field>
                </div>
                <x-field label="Reference / PO number" class="sm:col-span-2"><input name="reference" value="{{ old('reference', $sale->reference) }}" class="input" placeholder="Optional"></x-field>
            </div>
            <x-line-items :lines="$lines" :accounts="$incomeAccounts" :taxes="$taxes" :default-account="$defaultIncomeId" mode="items" account-label="Income account" />
            <x-field label="Notes to customer"><textarea name="notes" rows="3" class="input">{{ old('notes', $sale->notes) }}</textarea></x-field>
            @if ($isNew)<div><span class="label">Attachments</span><x-attachment-picker /></div>@endif
        </div>
        <div class="flex flex-wrap justify-end gap-2">
            <a href="{{ $isNew ? route('sales.index') : route('sales.show', $sale) }}" class="btn-ghost">Cancel</a>
            @if ($canDraft)<button name="intent" value="draft" class="btn-secondary">Save as draft</button>@endif
            <button name="intent" value="approve" class="btn-primary">{{ $canDraft ? 'Approve & save' : 'Save changes' }}</button>
        </div>
    </form>
</x-layouts.app>
