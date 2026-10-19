@php
    $state = [
        'accent_color' => old('accent_color', $brand->accent_color), 'layout' => old('layout', $brand->layout), 'font' => old('font', $brand->font),
        'logo_position' => old('logo_position', $brand->logo_position), 'address_position' => old('address_position', $brand->address_position),
        'show_logo' => (bool) old('show_logo', $brand->show_logo), 'show_tax_number' => (bool) old('show_tax_number', $brand->show_tax_number),
        'invoice_title' => old('invoice_title', $brand->invoice_title), 'invoice_notes' => old('invoice_notes', $brand->invoice_notes ?? ''),
        'invoice_footer' => old('invoice_footer', $brand->invoice_footer ?? ''), 'po_title' => old('po_title', $brand->po_title),
        'po_notes' => old('po_notes', $brand->po_notes ?? ''), 'po_footer' => old('po_footer', $brand->po_footer ?? ''),
        'invoice_prefix' => old('invoice_prefix', $brand->invoice_prefix), 'expense_prefix' => old('expense_prefix', $brand->expense_prefix),
        'po_prefix' => old('po_prefix', $brand->po_prefix),
    ];
    $swatches = ['#444444', '#2f6fed', '#0f766e', '#16a34a', '#b45309', '#dc2626', '#7c3aed', '#db2777'];
    $choice = 'cursor-pointer rounded-lg border px-3 py-1.5 text-sm';
@endphp
<x-settings title="Invoice customization">
<form method="POST" action="{{ route('settings.invoice.update') }}" enctype="multipart/form-data" class="grid gap-6 xl:grid-cols-[400px_1fr]"
      x-data="{
          s: @js($state), kind: 'invoice', logoUrl: @js($org->logoUrl()), removeLogo: false, src: '', timer: null,
          previewUrl(extra = {}) {
              const p = new URLSearchParams({ ...this.s, show_logo: this.s.show_logo ? 1 : 0, show_tax_number: this.s.show_tax_number ? 1 : 0, kind: this.kind, ...extra });
              return @js(route('settings.invoice.preview')) + '?' + p.toString();
          },
          refresh() { clearTimeout(this.timer); this.timer = setTimeout(() => this.src = this.previewUrl(), 300) },
          pick(c) { this.s.accent_color = c },
          init() { this.src = this.previewUrl(); this.$watch('s', () => this.refresh(), { deep: true }); this.$watch('kind', () => this.refresh()) },
      }">
    @csrf
    <div class="space-y-6">
        <div>
            <h2 class="text-lg font-semibold text-slate-900">Invoice customization</h2>
            <p class="text-sm text-slate-500">How your invoices and purchase orders look. Your address and contact details come from the <a href="{{ route('settings.profile') }}" class="text-brand-600 hover:underline">Business profile</a>.</p>
        </div>

        <section class="card space-y-5 p-5">
            <h3 class="text-sm font-semibold text-slate-900">General settings</h3>
            <div>
                <span class="label">Logo</span>
                <div class="flex items-center gap-4">
                    <div class="flex h-20 w-44 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
                        <template x-if="logoUrl"><img :src="logoUrl" alt="Logo" class="max-h-16 max-w-40 object-contain"></template>
                        <span x-show="!logoUrl" class="text-xs text-slate-400">No logo</span>
                    </div>
                    <div class="space-y-1 text-sm">
                        <label class="btn-secondary cursor-pointer"><x-icon name="image" class="h-4 w-4" /> <span x-text="logoUrl ? 'Change logo' : 'Upload logo'"></span>
                            <input type="file" name="logo" accept="image/*" class="hidden" x-ref="logo" @change="if ($event.target.files[0]) { logoUrl = URL.createObjectURL($event.target.files[0]); removeLogo = false }">
                        </label>
                        <button type="button" x-show="logoUrl" class="block font-medium text-brand-600 hover:underline" @click="logoUrl = null; removeLogo = true; $refs.logo.value = ''">Remove logo</button>
                    </div>
                </div>
                <input type="hidden" name="remove_logo" :value="removeLogo ? 1 : 0">
                <p class="hint">The preview shows the saved logo; a new logo appears there after you save.</p>
                <label class="mt-3 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="show_logo" value="1" x-model="s.show_logo"> Display logo</label>
            </div>

            <div>
                <span class="label">Accent colour</span>
                <div class="flex flex-wrap items-center gap-2">
                    @foreach ($swatches as $c)
                        <button type="button" @click="pick('{{ $c }}')" class="h-7 w-7 rounded-full ring-offset-2" :class="s.accent_color === '{{ $c }}' && 'ring-2 ring-slate-400'" style="background: {{ $c }}" aria-label="Use {{ $c }}"></button>
                    @endforeach
                </div>
                <div class="mt-3 flex items-center gap-2">
                    <input type="color" :value="s.accent_color" @input="s.accent_color = $event.target.value" class="h-10 w-12 cursor-pointer rounded border border-slate-200" aria-label="Pick a colour">
                    <input name="accent_color" x-model="s.accent_color" maxlength="7" class="input w-32 font-mono" aria-label="Hex colour" :class="/^#[0-9a-fA-F]{6}$/.test(s.accent_color) ? '' : 'border-red-300'">
                    <span class="text-sm text-slate-500">Hex</span>
                    <span class="h-10 w-10 rounded-lg border border-slate-200" :style="`background: ${s.accent_color}`"></span>
                </div>
            </div>

            <div>
                <span class="label">Template</span>
                <div class="grid grid-cols-2 gap-3">
                    @foreach (\App\Models\Branding::TEMPLATES as $value => $label)
                        <label class="cursor-pointer">
                            <input type="radio" name="layout" value="{{ $value }}" x-model="s.layout" class="sr-only">
                            <div class="relative h-40 overflow-hidden rounded-lg border-2 bg-white" :class="s.layout === '{{ $value }}' ? 'border-brand-500' : 'border-slate-200 hover:border-slate-300'">
                                <iframe :src="previewUrl({ layout: '{{ $value }}', kind: 'invoice', thumb: 1 })" class="pointer-events-none absolute left-0 top-0 h-[760px] w-[820px] origin-top-left scale-[0.215] border-0" tabindex="-1" aria-hidden="true" loading="lazy"></iframe>
                            </div>
                            <div class="mt-1.5 flex items-center gap-2 text-sm"><span class="h-4 w-4 rounded-full" :class="s.layout === '{{ $value }}' ? 'border-[5px] border-brand-500' : 'border-2 border-slate-300'"></span>{{ $label }}</div>
                        </label>
                    @endforeach
                </div>
            </div>

            <div><span class="label">Font</span><div class="flex flex-wrap gap-2">
                @foreach (\App\Models\Branding::FONTS as $value => $label)
                    <label class="{{ $choice }}" :class="s.font === '{{ $value }}' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'"><input type="radio" name="font" value="{{ $value }}" x-model="s.font" class="sr-only">{{ $label }}</label>
                @endforeach
            </div></div>
            <div><span class="label">Logo position</span><div class="flex gap-2">
                @foreach (['left' => 'Left', 'center' => 'Center', 'right' => 'Right'] as $value => $label)
                    <label class="{{ $choice }}" :class="s.logo_position === '{{ $value }}' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'"><input type="radio" name="logo_position" value="{{ $value }}" x-model="s.logo_position" class="sr-only">{{ $label }}</label>
                @endforeach
            </div></div>
            <div x-show="s.layout !== 'contemporary'"><span class="label">Your address</span><div class="flex gap-2">
                @foreach (['left' => 'Under logo', 'right' => 'Opposite logo'] as $value => $label)
                    <label class="{{ $choice }}" :class="s.address_position === '{{ $value }}' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'"><input type="radio" name="address_position" value="{{ $value }}" x-model="s.address_position" class="sr-only">{{ $label }}</label>
                @endforeach
            </div></div>
            <label class="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="show_tax_number" value="1" x-model="s.show_tax_number"> Show my business tax number under the address</label>
        </section>

        <section class="card space-y-4 p-5">
            <h3 class="text-sm font-semibold text-slate-900">Invoices</h3>
            <div class="grid grid-cols-2 gap-3">
                <x-field label="Title"><input name="invoice_title" x-model="s.invoice_title" class="input"></x-field>
                <x-field label="Payment terms (days)" name="default_payment_terms"><input type="number" name="default_payment_terms" min="0" max="365" value="{{ old('default_payment_terms', $org->default_payment_terms) }}" class="input"></x-field>
            </div>
            <x-field label="Default notes / payment instructions"><textarea name="invoice_notes" rows="3" x-model="s.invoice_notes" class="input" placeholder="Bank: … IBAN: …"></textarea></x-field>
            <x-field label="Footer"><input name="invoice_footer" x-model="s.invoice_footer" class="input" placeholder="Thank you for your business!"></x-field>
        </section>
        <section class="card space-y-4 p-5">
            <h3 class="text-sm font-semibold text-slate-900">Purchase orders</h3>
            <x-field label="Title"><input name="po_title" x-model="s.po_title" class="input"></x-field>
            <x-field label="Default notes"><textarea name="po_notes" rows="2" x-model="s.po_notes" class="input"></textarea></x-field>
            <x-field label="Footer"><input name="po_footer" x-model="s.po_footer" class="input"></x-field>
        </section>
        <section class="card space-y-3 p-5">
            <h3 class="text-sm font-semibold text-slate-900">Numbering</h3>
            <div class="grid grid-cols-3 gap-2">
                <x-field label="Sales"><input name="invoice_prefix" x-model="s.invoice_prefix" class="input"></x-field>
                <x-field label="Expenses"><input name="expense_prefix" x-model="s.expense_prefix" class="input"></x-field>
                <x-field label="POs"><input name="po_prefix" x-model="s.po_prefix" class="input"></x-field>
            </div>
            <p class="hint">Each transaction gets a unique number, e.g. <span x-text="s.invoice_prefix + '0001'"></span>.</p>
        </section>
        <div class="flex justify-end"><button class="btn-primary">Save all changes</button></div>
    </div>

    <div class="min-w-0 xl:sticky xl:top-4 xl:self-start">
        <div class="mb-3 flex gap-2">
            <button type="button" class="{{ $choice }}" :class="kind === 'invoice' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'" @click="kind = 'invoice'">Invoice preview</button>
            <button type="button" class="{{ $choice }}" :class="kind === 'po' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'" @click="kind = 'po'">Purchase order preview</button>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-100 p-4">
            <iframe :src="src" title="Invoice preview" class="h-[720px] w-full rounded border-0 bg-white" data-preview></iframe>
        </div>
    </div>
</form>
</x-settings>
