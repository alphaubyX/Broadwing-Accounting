<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderLine extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }
}
