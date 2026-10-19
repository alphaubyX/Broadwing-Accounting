@php
    $isNew = ! $expense->exists;
    $lines = old('lines') ?? ($isNew ? [] : \App\Support\Options::editableLines($expense->lines, false));
    $date = old('date', $expense->date?->toDateString() ?? today()->toDateString());
    $terms = $org->default_payment_terms;
@endphp
<x-layouts.app :title="$isNew ? 'New expense' : 'Edit '.$expense->number">
    <x-page-header :title="$isNew ? 'New expense' : 'Edit '.$expense->number" :subtitle="$isNew ? 'Anything you buy — paid already or on payment terms.' : null" />
    <form method="POST" action="{{ $isNew ? route('expenses.store') : route('expenses.update', $expense) }}" enctype="multipart/form-data" class="space-y-6"
          x-data="{ settlement: @js(old('settlement', $expense->settlement ?? 'PAID_NOW')), date: @js($date),
                    due: @js(old('due_date', $expense->due_date?->toDateString() ?? \Illuminate\Support\Carbon::parse($date)->addDays($terms)->toDateString())),
                    terms: {{ $terms }},
                    setDate(v) { this.date = v; const d = new Date(v + 'T00:00:00Z'); if (!isNaN(d)) { d.setUTCDate(d.getUTCDate() + this.terms); this.due = d.toISOString().slice(0, 10) } } }">
        @csrf
        @unless ($isNew) @method('PUT') @endunless
        <input type="hidden" name="settlement" :value="settlement">
        <div class="card space-y-5 p-6">
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <x-field label="Date" name="date"><input type="date" name="date" :value="date" @change="setDate($event.target.value)" class="input" required></x-field>
                <x-field label="Paid to" hint="Vendor, shop or person">
                    <input name="payee" list="vendors" value="{{ old('payee', $expense->payee()) }}" class="input" placeholder="e.g. Office Depot">
                    <datalist id="vendors">@foreach ($vendorNames as $n)<option value="{{ $n }}">@endforeach</datalist>
                </x-field>
                <x-field label="What was it for?" name="description" class="sm:col-span-2"><input name="description" value="{{ old('description', $expense->description) }}" class="input" required placeholder="e.g. Printer paper and ink"></x-field>
            </div>
            <div class="space-y-3 rounded-lg bg-slate-50 p-4">
                <div class="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
                    <button type="button" @click="settlement = 'PAID_NOW'" :class="settlement === 'PAID_NOW' ? 'bg-brand-500 text-white' : 'text-slate-500'" class="rounded-md px-3 py-1.5 font-medium">Already paid</button>
                    <button type="button" @click="settlement = 'ON_TERMS'" :class="settlement === 'ON_TERMS' ? 'bg-brand-500 text-white' : 'text-slate-500'" class="rounded-md px-3 py-1.5 font-medium">Pay later (bill)</button>
                </div>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div x-show="settlement === 'PAID_NOW'"><x-field label="Paid from" name="paid_from_account_id"><x-select name="paid_from_account_id" :options="$payFromAccounts" :selected="$expense->paid_from_account_id ?? $defaultBankId" /></x-field></div>
                    <div x-show="settlement === 'ON_TERMS'" x-cloak><x-field label="Due date" :hint="'Default terms: '.$terms.' days'"><input type="date" name="due_date" x-model="due" class="input"></x-field></div>
                    <x-field label="Receipt / bill number"><input name="reference" value="{{ old('reference', $expense->reference) }}" class="input" placeholder="Optional"></x-field>
                </div>
            </div>
            <x-line-items :lines="$lines" :accounts="$categories" :taxes="$taxes" :default-account="$defaultExpenseId" mode="amounts" account-label="Category" />
            <div>
                <span class="label">Receipt</span>
                <p class="hint mb-2">Snap a photo of the receipt or attach a file — you can also add it later.</p>
                <x-attachment-picker />
            </div>
        </div>
        <div class="flex justify-end gap-2">
            <a href="{{ $isNew ? route('expenses.index') : route('expenses.show', $expense) }}" class="btn-ghost">Cancel</a>
            <button class="btn-primary">{{ $isNew ? 'Save expense' : 'Save changes' }}</button>
        </div>
    </form>
</x-layouts.app>
