<form method="POST" action="{{ $tax ? route('settings.taxes.update', $tax) : route('settings.taxes.store') }}" class="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
    @csrf
    @if ($tax) @method('PUT') @endif
    <div class="grid gap-4 sm:grid-cols-2">
        <x-field label="Tax name" name="name"><input name="name" value="{{ old('name', $tax?->name) }}" class="input" placeholder="General Sales Tax" required></x-field>
        <x-field label="Abbreviation" name="abbreviation" hint="Shown on invoices, e.g. GST, VAT, HST"><input name="abbreviation" value="{{ old('abbreviation', $tax?->abbreviation) }}" class="input" placeholder="GST" required></x-field>
        <x-field label="Description" class="sm:col-span-2"><input name="description" value="{{ old('description', $tax?->description) }}" class="input" placeholder="Optional"></x-field>
        <x-field label="Tax rate (%)" name="rate"><input name="rate" value="{{ old('rate', $tax ? qty($tax->rate) : '') }}" inputmode="decimal" class="input" placeholder="16" required></x-field>
        <x-field label="Your tax number" hint="Your registration number for this tax"><input name="tax_number" value="{{ old('tax_number', $tax?->tax_number) }}" class="input"></x-field>
        <x-field label="Tax account" name="account_id" class="sm:col-span-2" hint="Tax collected and paid is tracked in this liability account">
            <x-select name="account_id" :options="$liabilityAccounts" :selected="$tax?->account_id ?? $defaultTaxAccount" />
        </x-field>
    </div>
    <label class="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" name="show_tax_number" value="1" class="mt-0.5" @checked(old('show_tax_number', $tax?->show_tax_number ?? true))> Show tax number on invoices</label>
    <label class="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" name="is_recoverable" value="1" class="mt-0.5" @checked(old('is_recoverable', $tax?->is_recoverable ?? true))>
        <span>This tax is recoverable<span class="block text-xs text-slate-500">Tick if you can claim back the tax you pay on purchases. If not, the tax becomes part of the expense cost.</span></span></label>
    <div class="flex justify-end gap-2">
        <a href="{{ route('settings.taxes') }}" class="btn-ghost">Cancel</a>
        <button class="btn-primary">{{ $tax ? 'Save sales tax' : 'Create sales tax' }}</button>
    </div>
</form>
