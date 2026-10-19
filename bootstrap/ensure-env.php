<?php

/*
 * First-run helper for hosting without a terminal (e.g. cPanel): create .env
 * from .env.example and give it a fresh encryption key, so the installer
 * page can load. The installer then fills in the database settings.
 */

$base = dirname(__DIR__);
$env = $base.'/.env';

if (! file_exists($env) && file_exists($base.'/.env.example')) {
    @copy($base.'/.env.example', $env);
    @chmod($env, 0600);
}

if (file_exists($env) && is_writable($env)) {
    $contents = (string) file_get_contents($env);
    if (! preg_match('/^APP_KEY=\S+/m', $contents)) {
        $key = 'base64:'.base64_encode(random_bytes(32));
        $contents = preg_match('/^APP_KEY=.*$/m', $contents)
            ? preg_replace('/^APP_KEY=.*$/m', 'APP_KEY='.$key, $contents)
            : "APP_KEY={$key}\n".$contents;
        file_put_contents($env, $contents);
    }
}
