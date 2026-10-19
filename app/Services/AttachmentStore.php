<?php

namespace App\Services;

use App\Models\Attachment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Receipts, attachments and logos live in storage/app/private, outside the
 * public web folder; they are served only through the app (password-protected).
 */
final class AttachmentStore
{
    public static function validate(UploadedFile $file, bool $imagesOnly = false): void
    {
        $allowed = config('broadwing.upload_mimes');
        if ($imagesOnly) {
            $allowed = array_values(array_filter($allowed, fn ($m) => str_starts_with($m, 'image/')));
        }
        if (! $file->isValid()) {
            throw ValidationException::withMessages(['files' => "\"{$file->getClientOriginalName()}\" could not be uploaded."]);
        }
        if ($file->getSize() > config('broadwing.upload_max_kb') * 1024) {
            throw ValidationException::withMessages(['files' => "\"{$file->getClientOriginalName()}\" is larger than 10 MB."]);
        }
        if (! in_array($file->getMimeType(), $allowed, true)) {
            throw ValidationException::withMessages(['files' => "\"{$file->getClientOriginalName()}\" must be ".($imagesOnly ? 'an image.' : 'an image or a PDF.')]);
        }
    }

    public static function put(UploadedFile $file, string $folder): array
    {
        $ext = strtolower(preg_replace('/[^a-z0-9]/i', '', $file->getClientOriginalExtension()) ?: 'bin');
        $path = $file->storeAs($folder, Str::uuid().'.'.$ext, 'local');

        return [
            'file_name' => mb_substr($file->getClientOriginalName(), 0, 500),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size' => $file->getSize(),
            'storage_path' => $path,
        ];
    }

    /**
     * Store every uploaded file from the "files" and "camera" fields and link them to a document.
     *
     * @param  array<int, UploadedFile|null>  $files
     */
    public static function attach(int $organizationId, string $column, int $id, array $files): int
    {
        $files = array_values(array_filter($files, fn ($f) => $f instanceof UploadedFile));
        foreach ($files as $file) {
            self::validate($file);
        }
        foreach ($files as $file) {
            Attachment::create(['organization_id' => $organizationId, $column => $id] + self::put($file, "attachments/{$organizationId}"));
        }

        return count($files);
    }

    public static function delete(?string $path): void
    {
        if ($path) {
            Storage::disk('local')->delete($path);
        }
    }
}
