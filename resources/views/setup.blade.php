<x-layouts.plain title="Welcome to Broadwing Accounting" subtitle="Tell us a little about your business. Everything can be changed later in Settings.">
    <form method="POST" action="{{ route('setup.store') }}" class="card space-y-6 p-6">
        @csrf
        <section class="grid gap-4 sm:grid-cols-2">
            <h2 class="text-sm font-semibold text-slate-900 sm:col-span-2">About you</h2>
            <x-field label="Your name" name="owner_name"><input name="owner_name" value="{{ old('owner_name') }}" class="input" autocomplete="name" autofocus></x-field>
            <x-field label="Your email" name="owner_email" hint="You'll be the owner of this business"><input type="email" name="owner_email" value="{{ old('owner_email') }}" class="input" required autocomplete="email"></x-field>
        </section>
        <section class="grid gap-4 sm:grid-cols-2">
            <h2 class="text-sm font-semibold text-slate-900 sm:col-span-2">Your business</h2>
            <x-field label="Business name" name="name" class="sm:col-span-2"><input name="name" value="{{ old('name') }}" class="input" required placeholder="Broadwing Trading"></x-field>
            <x-field label="Legal name" hint="If different from the business name"><input name="legal_name" value="{{ old('legal_name') }}" class="input"></x-field>
            <x-field label="Currency" name="currency"><x-select name="currency" :options="collect(\App\Support\Currencies::ALL)->mapWithKeys(fn ($n, $c) => [$c => $c.' — '.$n])" selected="USD" /></x-field>
            <x-field label="Email" name="email"><input type="email" name="email" value="{{ old('email') }}" class="input"></x-field>
            <x-field label="Phone"><input name="phone" value="{{ old('phone') }}" class="input"></x-field>
            <x-field label="Address"><input name="address_line1" value="{{ old('address_line1') }}" class="input"></x-field>
            <x-field label="City"><input name="city" value="{{ old('city') }}" class="input"></x-field>
            <x-field label="Country"><input name="country" value="{{ old('country') }}" class="input"></x-field>
            <x-field label="Tax / VAT number"><input name="tax_number" value="{{ old('tax_number') }}" class="input"></x-field>
            <x-fiscal-year-end />
        </section>
        <section class="rounded-lg bg-slate-50 p-4">
            <div class="mb-3 text-sm font-medium text-slate-700">Do you charge sales tax or VAT? (optional)</div>
            <div class="grid gap-4 sm:grid-cols-2">
                <x-field label="Tax name"><input name="tax_name" value="{{ old('tax_name') }}" class="input" placeholder="VAT"></x-field>
                <x-field label="Rate (%)" name="tax_rate"><input name="tax_rate" value="{{ old('tax_rate') }}" class="input" inputmode="decimal" placeholder="15"></x-field>
            </div>
        </section>
        <p class="text-xs text-slate-500">We'll create a ready-to-use chart of accounts for you. You can rename, add or archive accounts at any time.</p>
        <div class="flex justify-end"><button class="btn-primary">Create my business</button></div>
    </form>
</x-layouts.plain>
