<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/** A commitment, not an accounting transaction: it posts nothing until converted to an expense. */
class PurchaseOrder extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['date' => 'date', 'expected_date' => 'date'];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PurchaseOrderLine::class)->orderBy('position');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function expense(): HasOne
    {
        return $this->hasOne(Expense::class);
    }

    public function isOpen(): bool
    {
        return in_array($this->status, ['DRAFT', 'SENT'], true);
    }
}
