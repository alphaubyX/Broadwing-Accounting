<?php

return [
    // True once the installer has saved the database settings and created the tables.
    'installed' => (bool) env('APP_INSTALLED', false),

    // Hash of the shared password that protects the app until central Broadwing sign-in exists.
    'password_hash' => env('APP_PASSWORD_HASH'),

    // Receipts and attachments.
    'upload_max_kb' => 10240,
    'upload_mimes' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'],
];
