<?php

namespace App\Http\Controllers;

use App\Services\EnvFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PDO;
use Throwable;

/**
 * WordPress-style first-run installer: checks the server, saves the MySQL
 * settings and app password to .env, and creates the tables. It disappears
 * (404) once APP_INSTALLED=true.
 */
class InstallController extends Controller
{
    private const EXTENSIONS = ['pdo_mysql', 'mbstring', 'openssl', 'tokenizer', 'xml', 'ctype', 'fileinfo', 'zip', 'gd', 'dom', 'iconv', 'simplexml', 'xmlreader', 'xmlwriter', 'zlib'];

    private function checks(): array
    {
        $checks = [['PHP 8.3 or newer (this server: '.PHP_VERSION.')', version_compare(PHP_VERSION, '8.3.0', '>=')]];
        foreach (self::EXTENSIONS as $ext) {
            $checks[] = ["PHP extension: {$ext}", extension_loaded($ext)];
        }
        foreach (['.env' => base_path('.env'), 'storage' => storage_path(), 'bootstrap/cache' => base_path('bootstrap/cache')] as $label => $path) {
            $checks[] = ["Writable: {$label}", is_writable($path)];
        }

        return $checks;
    }

    public function show()
    {
        abort_if(config('broadwing.installed'), 404);

        return view('install', ['checks' => $this->checks()]);
    }

    public function store(Request $request)
    {
        abort_if(config('broadwing.installed'), 404);

        $data = $request->validate([
            'db_host' => ['required', 'string', 'max:255'],
            'db_port' => ['required', 'integer', 'between:1,65535'],
            'db_database' => ['required', 'string', 'max:64'],
            'db_username' => ['required', 'string', 'max:64'],
            'db_password' => ['nullable', 'string', 'max:255'],
            'app_password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ], [], ['app_password' => 'app password']);

        try {
            new PDO(
                "mysql:host={$data['db_host']};port={$data['db_port']};dbname={$data['db_database']};charset=utf8mb4",
                $data['db_username'],
                $data['db_password'] ?? '',
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 10],
            );
        } catch (Throwable $e) {
            return back()->withInput($request->except(['db_password', 'app_password', 'app_password_confirmation']))
                ->withErrors(['db_host' => 'Could not connect to MySQL: '.$e->getMessage()]);
        }

        Config::set('database.connections.mysql', array_merge(config('database.connections.mysql'), [
            'host' => $data['db_host'], 'port' => $data['db_port'], 'database' => $data['db_database'],
            'username' => $data['db_username'], 'password' => $data['db_password'] ?? '',
        ]));
        DB::purge('mysql');
        Artisan::call('migrate', ['--force' => true]);

        EnvFile::set([
            'APP_URL' => $request->getSchemeAndHttpHost(),
            'DB_CONNECTION' => 'mysql',
            'DB_HOST' => $data['db_host'],
            'DB_PORT' => (string) $data['db_port'],
            'DB_DATABASE' => $data['db_database'],
            'DB_USERNAME' => $data['db_username'],
            'DB_PASSWORD' => $data['db_password'] ?? '',
            'APP_PASSWORD_HASH' => Hash::make($data['app_password']),
            'APP_INSTALLED' => true,
        ]);

        $request->session()->regenerate();
        $request->session()->put('broadwing_signed_in', true);

        return redirect()->route('setup');
    }
}
