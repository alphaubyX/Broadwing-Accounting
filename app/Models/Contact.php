<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['is_archived' => 'boolean'];

    public const TYPES = ['CUSTOMER' => 'Customer', 'VENDOR' => 'Vendor / supplier', 'BOTH' => 'Customer & vendor'];
}
