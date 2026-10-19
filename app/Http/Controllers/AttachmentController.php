<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Expense;
use App\Models\PurchaseOrder;
use App\Models\Sale;
use App\Services\AttachmentStore;
use App\Support\CurrentOrganization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    private const TARGETS = [
        'sales' => [Sale::class, 'sale_id'],
        'expenses' => [Expense::class, 'expense_id'],
        'purchase-orders' => [PurchaseOrder::class, 'purchase_order_id'],
    ];

    public function store(Request $request, string $kind, int $id)
    {
        $org = CurrentOrganization::require();
        abort_unless(isset(self::TARGETS[$kind]), 404);
        [$model, $column] = self::TARGETS[$kind];
        $model::where('organization_id', $org->id)->findOrFail($id);

        $count = AttachmentStore::attach($org->id, $column, $id, array_merge($request->file('files', []), $request->file('camera', [])));
        if ($count === 0) {
            return back()->withErrors(['files' => 'Choose a file or take a photo first.']);
        }

        return back()->with('status', $count === 1 ? 'File attached.' : "{$count} files attached.");
    }

    public function show(int $attachment)
    {
        $a = Attachment::where('organization_id', CurrentOrganization::require()->id)->findOrFail($attachment);
        abort_unless(Storage::disk('local')->exists($a->storage_path), 404);

        return Storage::disk('local')->response($a->storage_path, $a->file_name, [
            'Content-Type' => $a->mime_type,
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
            'Cache-Control' => 'private, max-age=3600',
        ], 'inline');
    }

    public function destroy(int $attachment)
    {
        $a = Attachment::where('organization_id', CurrentOrganization::require()->id)->findOrFail($attachment);
        AttachmentStore::delete($a->storage_path);
        $a->delete();

        return back()->with('status', 'Attachment deleted.');
    }

    public function logo()
    {
        $org = CurrentOrganization::require();
        abort_unless($org->logo_path && Storage::disk('local')->exists($org->logo_path), 404);

        return Storage::disk('local')->response($org->logo_path, null, [
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'; sandbox",
            'Cache-Control' => 'private, max-age=300',
        ], 'inline');
    }
}
