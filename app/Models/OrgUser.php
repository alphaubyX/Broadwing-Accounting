<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrgUser extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['can_send_invoices' => 'boolean'];

    /** What each role can do. Enforcement arrives with central Broadwing sign-in. */
    public const ROLES = [
        'OWNER' => ['label' => 'Owner', 'help' => 'Full access. Cannot be removed.'],
        'ADMIN' => ['label' => 'Admin', 'help' => 'Full access, including settings and users.'],
        'EDITOR' => ['label' => 'Editor', 'help' => 'Can create and edit sales, expenses and purchase orders. No access to settings.'],
        'VIEWER' => ['label' => 'Viewer', 'help' => "Can see transactions and reports but can't change anything."],
    ];
}
