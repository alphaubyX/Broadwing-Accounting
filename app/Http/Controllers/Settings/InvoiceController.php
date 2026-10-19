<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Branding;
use App\Services\AttachmentStore;
use App\Support\CurrentOrganization;
use App\Support\Documents;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    private const TEXT_FIELDS = ['invoice_title', 'invoice_notes', 'invoice_footer', 'po_title', 'po_notes', 'po_footer', 'invoice_prefix', 'expense_prefix', 'po_prefix'];

    public function edit()
    {
        return view('settings.invoice', ['brand' => CurrentOrganization::require()->brand()]);
    }

    public function update(Request $request)
    {
        $org = CurrentOrganization::require();
        $data = $request->validate([
            'accent_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'layout' => ['required', Rule::in(array_keys(Branding::TEMPLATES))],
            'font' => ['required', Rule::in(array_keys(Branding::FONTS))],
            'logo_position' => ['required', 'in:left,center,right'],
            'address_position' => ['required', 'in:left,right'],
            'default_payment_terms' => ['required', 'integer', 'between:0,365'],
            'invoice_title' => ['nullable', 'string', 'max:60'],
            'invoice_notes' => ['nullable', 'string', 'max:5000'],
            'invoice_footer' => ['nullable', 'string', 'max:2000'],
            'po_title' => ['nullable', 'string', 'max:60'],
            'po_notes' => ['nullable', 'string', 'max:5000'],
            'po_footer' => ['nullable', 'string', 'max:2000'],
            'invoice_prefix' => ['nullable', 'string', 'max:10'],
            'expense_prefix' => ['nullable', 'string', 'max:10'],
            'po_prefix' => ['nullable', 'string', 'max:10'],
            'logo' => ['nullable', 'file'],
        ], ['accent_color.regex' => 'The accent colour must be a hex colour like #2f6fed.']);

        $logoPath = $org->logo_path;
        if ($request->hasFile('logo')) {
            AttachmentStore::validate($request->file('logo'), imagesOnly: true);
            $logoPath = AttachmentStore::put($request->file('logo'), "logos/{$org->id}")['storage_path'];
            AttachmentStore::delete($org->logo_path);
        } elseif ($request->boolean('remove_logo')) {
            AttachmentStore::delete($org->logo_path);
            $logoPath = null;
        }
        $org->update(['logo_path' => $logoPath, 'default_payment_terms' => $data['default_payment_terms']]);

        $org->branding()->updateOrCreate([], [
            'accent_color' => strtolower($data['accent_color']),
            'layout' => $data['layout'],
            'font' => $data['font'],
            'logo_position' => $data['logo_position'],
            'address_position' => $data['address_position'],
            'show_logo' => $request->boolean('show_logo'),
            'show_tax_number' => $request->boolean('show_tax_number'),
            'invoice_title' => $data['invoice_title'] ?: 'Invoice',
            'po_title' => $data['po_title'] ?: 'Purchase Order',
            'invoice_prefix' => $data['invoice_prefix'] ?? '',
            'expense_prefix' => $data['expense_prefix'] ?? '',
            'po_prefix' => $data['po_prefix'] ?? '',
        ] + collect($data)->only(['invoice_notes', 'invoice_footer', 'po_notes', 'po_footer'])->all());

        return back()->with('status', 'Saved.');
    }

    /** Live preview (shown in an iframe): renders the sample document with unsaved settings from the query string. */
    public function preview(Request $request)
    {
        $org = CurrentOrganization::require();
        $brand = $org->brand();
        $q = fn (string $key, array $allowed, string $default) => in_array($request->query($key), $allowed, true) ? $request->query($key) : $default;
        $style = [
            'accent' => preg_match('/^#[0-9a-fA-F]{6}$/', (string) $request->query('accent_color')) ? $request->query('accent_color') : $brand->accent_color,
            'font' => $q('font', array_keys(Branding::FONTS), $brand->font),
            'layout' => $q('layout', array_keys(Branding::TEMPLATES), $brand->layout),
            'logo_position' => $q('logo_position', ['left', 'center', 'right'], $brand->logo_position),
            'address_position' => $q('address_position', ['left', 'right'], $brand->address_position),
            'show_tax_number' => $request->has('accent_color') ? $request->boolean('show_tax_number') : $brand->show_tax_number,
            'show_logo' => $request->has('accent_color') ? $request->boolean('show_logo') : $brand->show_logo,
        ];
        $texts = [];
        foreach (self::TEXT_FIELDS as $f) {
            $texts[$f] = mb_substr((string) $request->query($f, (string) $brand->{$f}), 0, 2000);
        }

        return view('settings.invoice-preview', [
            'doc' => Documents::sample($org, $style, $texts, $request->query('kind') === 'po' ? 'po' : 'invoice'),
            'thumb' => $request->boolean('thumb'),
        ]);
    }
}
