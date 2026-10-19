<?php

namespace App\Services;

use RuntimeException;

/** Update KEY=value pairs in the .env file (used by the installer and settings). */
final class EnvFile
{
    /** @param  array<string, string|bool|null>  $values */
    public static function set(array $values): void
    {
        $path = base_path('.env');
        if (! is_writable($path)) {
            throw new RuntimeException('The settings file (.env) is not writable. Check its permissions in File Manager (0600 or 0644).');
        }
        $contents = (string) file_get_contents($path);
        foreach ($values as $key => $value) {
            $line = $key.'='.self::quote($value);
            $pattern = '/^'.preg_quote($key, '/').'=.*$/m';
            $contents = preg_match($pattern, $contents)
                ? preg_replace_callback($pattern, fn () => $line, $contents)
                : rtrim($contents)."\n".$line."\n";
        }
        file_put_contents($path, $contents);
    }

    private static function quote(string|bool|null $value): string
    {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }
        $value = (string) $value;
        if ($value === '' || preg_match('/^[A-Za-z0-9_.:\/@+=-]+$/', $value)) {
            return $value;
        }

        return '"'.str_replace(['\\', '"', '$'], ['\\\\', '\\"', '\\$'], $value).'"';
    }
}
