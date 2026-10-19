<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['date' => 'date', 'due_date' => 'date'];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function paidIntoAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'paid_into_account_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(SaleLine::class)->orderBy('position');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->orderBy('date');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }
}
