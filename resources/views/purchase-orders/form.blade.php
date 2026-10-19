@php
    $isNew = ! $po->exists;
    $lines = old('lines') ?? ($isNew ? [] : \App\Support\Options::editableLines($po->lines, true));
@endphp
<x-layouts.app :title="$isNew ? 'New purchase order' : 'Edit '.$po->number">
    <x-page-header :title="$isNew ? 'New purchase order' : 'Edit '.$po->number" :subtitle="$isNew ? 'Send an order to a vendor. It becomes an expense when you\'re billed.' : null" />
    <form method="POST" action="{{ $isNew ? route('purchase-orders.store') : route('purchase-orders.update', $po) }}" enctype="multipart/form-data" class="space-y-6">
        @csrf
        @unless ($isNew) @method('PUT') @endunless
        <div class="card space-y-5 p-6">
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <x-field label="Vendor" name="contact_id" class="sm:col-span-2">
                    <x-select name="contact_id" :options="$vendors" :selected="$po->contact_id" placeholder="Choose a vendor…" required />
                    <span class="hint"><a href="{{ route('contacts.create', ['type' => 'VENDOR']) }}" target="_blank" class="text-brand-600 hover:underline">+ New vendor</a> (then reload this page)</span>
                </x-field>
                <x-field label="Order date" name="date"><input type="date" name="date" value="{{ old('date', $po->date?->toDateString()) }}" class="input" required></x-field>
                <x-field label="Delivery by"><input type="date" name="expected_date" value="{{ old('expected_date', $po->expected_date?->toDateString()) }}" class="input"></x-field>
                <x-field label="Reference" class="sm:col-span-2"><input name="reference" value="{{ old('reference', $po->reference) }}" class="input" placeholder="Optional"></x-field>
            </div>
            <x-line-items :lines="$lines" :accounts="$categories" :taxes="$taxes" :default-account="$defaultExpenseId" mode="items" account-label="Category" />
            <x-field label="Notes / delivery instructions"><textarea name="notes" rows="3" class="input">{{ old('notes', $po->notes) }}</textarea></x-field>
            @if ($isNew)<div><span class="label">Attachments</span><x-attachment-picker /></div>@endif
        </div>
        <div class="flex justify-end gap-2">
            <a href="{{ $isNew ? route('purchase-orders.index') : route('purchase-orders.show', $po) }}" class="btn-ghost">Cancel</a>
            <button class="btn-primary">Save purchase order</button>
        </div>
    </form>
</x-layouts.app>
