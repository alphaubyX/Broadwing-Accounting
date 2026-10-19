@props(['kind', 'id', 'attachments'])
<section class="card p-5">
    <h2 class="text-sm font-semibold text-slate-900">Receipts & attachments</h2>
    @if ($attachments->isNotEmpty())
        <ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            @foreach ($attachments as $a)
                <li class="group relative rounded-lg border border-slate-200 p-2">
                    <a href="{{ route('files.show', $a->id) }}" target="_blank" rel="noopener" class="block">
                        @if ($a->isImage())
                            <img src="{{ route('files.show', $a->id) }}" alt="{{ $a->file_name }}" class="h-28 w-full rounded object-cover">
                        @else
                            <div class="flex h-28 items-center justify-center rounded bg-slate-50"><x-icon name="file" class="h-10 w-10 text-slate-400" /></div>
                        @endif
                        <div class="mt-1 truncate text-xs text-slate-600">{{ $a->file_name }}</div>
                    </a>
                    <div class="absolute right-1 top-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                        <x-confirm-button :action="route('files.destroy', $a->id)" method="DELETE" confirm="Delete this attachment?" class="btn-danger px-2 py-1" aria-label="Delete attachment">
                            <x-icon name="trash" class="h-3.5 w-3.5" />
                        </x-confirm-button>
                    </div>
                </li>
            @endforeach
        </ul>
    @endif
    <form method="POST" action="{{ route('attachments.store', [$kind, $id]) }}" enctype="multipart/form-data" class="mt-4 space-y-3">
        @csrf
        <x-attachment-picker />
        <button class="btn-primary">Upload</button>
    </form>
</section>
