<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branding extends Model
{
    protected $guarded = ['id'];

    protected $attributes = [
        'accent_color' => '#2f6fed',
        'font' => 'sans',
        'layout' => 'contemporary',
        'logo_position' => 'left',
        'address_position' => 'right',
        'show_tax_number' => true,
        'show_logo' => true,
        'invoice_title' => 'Invoice',
        'po_title' => 'Purchase Order',
        'invoice_prefix' => 'INV-',
        'expense_prefix' => 'EXP-',
        'po_prefix' => 'PO-',
    ];

    protected $casts = ['show_tax_number' => 'boolean', 'show_logo' => 'boolean'];

    public const TEMPLATES = ['contemporary' => 'Contemporary', 'modern' => 'Modern', 'classic' => 'Classic', 'compact' => 'Compact'];

    public const FONTS = ['sans' => 'Modern', 'serif' => 'Classic serif', 'mono' => 'Typewriter'];

    /** @return array<string, mixed> style values used by the document renderer */
    public function style(): array
    {
        return [
            'accent' => $this->accent_color,
            'font' => $this->font,
            'layout' => array_key_exists($this->layout, self::TEMPLATES) ? $this->layout : 'contemporary',
            'logo_position' => $this->logo_position,
            'address_position' => $this->address_position,
            'show_tax_number' => (bool) $this->show_tax_number,
            'show_logo' => (bool) $this->show_logo,
        ];
    }
}
