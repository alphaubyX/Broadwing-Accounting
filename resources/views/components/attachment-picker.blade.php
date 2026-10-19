{{-- Pick receipts/documents or take a photo (opens the camera on phones). Submitted as files[]. --}}
<div x-data="attachmentPicker()">
    <input x-ref="store" type="file" name="files[]" multiple class="hidden">
    <div class="flex flex-wrap gap-2">
        <label class="btn-secondary cursor-pointer"><x-icon name="paperclip" class="h-4 w-4" /> Attach file
            <input type="file" accept="image/*,application/pdf" multiple class="hidden" @change="add($event.target.files); $event.target.value = ''">
        </label>
        <label class="btn-secondary cursor-pointer"><x-icon name="camera" class="h-4 w-4" /> Take photo
            <input type="file" accept="image/*" capture="environment" class="hidden" data-camera @change="add($event.target.files); $event.target.value = ''">
        </label>
    </div>
    <ul class="mt-3 flex flex-wrap gap-3" x-show="previews.length" x-cloak>
        <template x-for="(p, i) in previews" :key="i">
            <li class="relative flex w-28 flex-col items-center rounded-lg border border-slate-200 bg-white p-2">
                <template x-if="p.url"><img :src="p.url" alt="" class="h-20 w-full rounded object-cover"></template>
                <template x-if="!p.url"><x-icon name="file" class="h-20 w-10 text-slate-400" /></template>
                <span class="mt-1 w-full truncate text-center text-xs text-slate-600" x-text="p.name"></span>
                <button type="button" @click="remove(i)" class="absolute -right-2 -top-2 rounded-full border border-slate-200 bg-white p-0.5 text-slate-500 hover:text-red-600" :aria-label="'Remove ' + p.name">
                    <x-icon name="x" class="h-3.5 w-3.5" />
                </button>
            </li>
        </template>
    </ul>
</div>
