<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tax extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['show_tax_number' => 'boolean', 'is_recoverable' => 'boolean', 'is_archived' => 'boolean'];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function rateNumber(): float
    {
        return (float) $this->rate;
    }

    /** e.g. "GST (16%)" */
    public function label(): string
    {
        return $this->abbreviation.' ('.rtrim(rtrim(number_format($this->rateNumber(), 3, '.', ''), '0'), '.').'%)';
    }
}
