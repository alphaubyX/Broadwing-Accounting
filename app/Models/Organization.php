<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Organization extends Model
{
    protected $guarded = ['id'];

    public function branding(): HasOne
    {
        return $this->hasOne(Branding::class);
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    public function taxes(): HasMany
    {
        return $this->hasMany(Tax::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(OrgUser::class);
    }

    /** Branding with defaults, so documents render even before it's customised. */
    public function brand(): Branding
    {
        return $this->branding ?? new Branding(['organization_id' => $this->id]);
    }

    /** @return string[] */
    public function addressLines(): array
    {
        $cityLine = implode(', ', array_filter([$this->city, $this->state, $this->postal_code]));

        return array_values(array_filter([$this->address_line1, $this->address_line2, $cityLine, $this->country]));
    }

    /** @return string[] */
    public function contactLines(): array
    {
        return array_values(array_filter([$this->phone, $this->email, $this->website]));
    }

    public function logoUrl(): ?string
    {
        return $this->logo_path ? route('files.logo', ['v' => $this->updated_at?->timestamp]) : null;
    }
}
