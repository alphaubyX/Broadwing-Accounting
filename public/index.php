<?php

// Friendly message instead of a fatal error when the server runs an old PHP
// version. This block must stay compatible with PHP 7.x.
if (PHP_VERSION_ID < 80300) {
    http_response_code(503);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><meta name="viewport" content="width=device-width,initial-scale=1"><title>PHP 8.3 needed</title>'
        .'<div style="font-family:system-ui,sans-serif;max-width:560px;margin:80px auto;padding:0 16px;line-height:1.5;color:#1e293b">'
        .'<h1 style="font-size:22px">Broadwing Accounting needs PHP 8.3 or newer</h1>'
        .'<p>This website is running PHP <b>'.htmlspecialchars(PHP_VERSION).'</b>.</p>'
        .'<p>In cPanel, open <b>MultiPHP Manager</b> (or <b>Select PHP Version</b>) and choose PHP 8.3 or newer for this domain, '
        .'or ask your hosting provider to switch this domain to PHP 8.3.</p></div>';
    exit;
}

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Create .env with an encryption key on first run (no terminal needed)...
require __DIR__.'/../bootstrap/ensure-env.php';

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
