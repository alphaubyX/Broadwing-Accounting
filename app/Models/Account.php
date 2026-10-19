<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['is_system' => 'boolean', 'is_archived' => 'boolean'];

    public function mappings(): HasMany
    {
        return $this->hasMany(AccountMapping::class);
    }

    public function journalLines(): HasMany
    {
        return $this->hasMany(JournalLine::class);
    }

    public function label(): string
    {
        return "{$this->code} · {$this->name}";
    }
}
