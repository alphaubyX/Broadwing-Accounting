<x-settings title="Business profile">
    @if (session('welcome'))
        <div class="mb-4 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
            Your business is ready. Check your details here, then add your logo and choose a template under <a href="{{ route('settings.invoice') }}" class="font-medium underline">Invoice customization</a>.
        </div>
    @endif
    <h2 class="text-lg font-semibold text-slate-900">Business profile</h2>
    <p class="mb-4 text-sm text-slate-500">These details appear on your invoices and purchase orders.</p>
    <form method="POST" action="{{ route('settings.profile.update') }}" class="card space-y-6 p-6">
        @csrf @method('PUT')
        <section class="grid gap-4 sm:grid-cols-2">
            <h3 class="text-sm font-semibold text-slate-900 sm:col-span-2">Business</h3>
            <x-field label="Business name" name="name"><input name="name" value="{{ old('name', $org->name) }}" class="input" required></x-field>
            <x-field label="Legal name" hint="Printed on documents if set"><input name="legal_name" value="{{ old('legal_name', $org->legal_name) }}" class="input"></x-field>
            <x-field label="Email" name="email"><input type="email" name="email" value="{{ old('email', $org->email) }}" class="input"></x-field>
            <x-field label="Phone"><input name="phone" value="{{ old('phone', $org->phone) }}" class="input"></x-field>
            <x-field label="Website" class="sm:col-span-2"><input name="website" value="{{ old('website', $org->website) }}" class="input"></x-field>
        </section>
        <section class="grid gap-4 sm:grid-cols-2">
            <h3 class="text-sm font-semibold text-slate-900 sm:col-span-2">Address</h3>
            <x-field label="Address line 1" class="sm:col-span-2"><input name="address_line1" value="{{ old('address_line1', $org->address_line1) }}" class="input"></x-field>
            <x-field label="Address line 2" class="sm:col-span-2"><input name="address_line2" value="{{ old('address_line2', $org->address_line2) }}" class="input"></x-field>
            <x-field label="City"><input name="city" value="{{ old('city', $org->city) }}" class="input"></x-field>
            <x-field label="State / province"><input name="state" value="{{ old('state', $org->state) }}" class="input"></x-field>
            <x-field label="Postal code"><input name="postal_code" value="{{ old('postal_code', $org->postal_code) }}" class="input"></x-field>
            <x-field label="Country"><input name="country" value="{{ old('country', $org->country) }}" class="input"></x-field>
        </section>
        <section class="grid gap-4 sm:grid-cols-2">
            <h3 class="text-sm font-semibold text-slate-900 sm:col-span-2">Tax registration</h3>
            <x-field label="Tax number label" hint='e.g. "VAT number", "GST no.", "TRN", "NTN"'><input name="tax_number_label" value="{{ old('tax_number_label', $org->tax_number_label) }}" class="input"></x-field>
            <x-field label="Tax number"><input name="tax_number" value="{{ old('tax_number', $org->tax_number) }}" class="input"></x-field>
        </section>
        <div class="flex justify-end"><button class="btn-primary">Save</button></div>
    </form>
</x-settings>
