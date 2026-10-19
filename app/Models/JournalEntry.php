<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JournalEntry extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['date' => 'date'];

    public function lines(): HasMany
    {
        return $this->hasMany(JournalLine::class)->orderByDesc('debit');
    }
}
