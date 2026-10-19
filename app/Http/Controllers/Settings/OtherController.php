<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Services\EnvFile;
use App\Services\Exporter;
use App\Support\CurrentOrganization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OtherController extends Controller
{
    public function subscription()
    {
        return view('settings.subscription');
    }

    public function export()
    {
        return view('settings.export', ['receipts' => Attachment::where('organization_id', CurrentOrganization::require()->id)->count()]);
    }

    public function download(string $kind)
    {
        $org = CurrentOrganization::require();
        $base = (Str::slug($org->name) ?: 'broadwing').'-'.today()->toDateString();

        return match ($kind) {
            'transactions.xlsx' => response()->download(Exporter::workbook($org), "{$base}-transactions.xlsx")->deleteFileAfterSend(),
            'transactions.csv' => response()->streamDownload(fn () => print (Exporter::csv($org)), "{$base}-transactions.csv", ['Content-Type' => 'text/csv; charset=utf-8']),
            'receipts.zip' => response()->download(Exporter::receipts($org), "{$base}-receipts.zip")->deleteFileAfterSend(),
            default => abort(404),
        };
    }

    public function security()
    {
        return view('settings.security');
    }

    public function updatePassword(Request $request)
    {
        $current = (string) config('broadwing.password_hash');
        $data = $request->validate([
            'current_password' => [$current ? 'required' : 'nullable', 'string'],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ], [], ['password' => 'new password']);
        // With no password set (e.g. cleared in .env after forgetting it), a new one can be set directly.
        if ($current && ! Hash::check((string) $data['current_password'], $current)) {
            return back()->withErrors(['current_password' => 'The current password is not correct.']);
        }
        EnvFile::set(['APP_PASSWORD_HASH' => Hash::make($data['password'])]);

        $request->session()->put('broadwing_signed_in', true);

        return back()->with('status', 'Password changed.');
    }
}
