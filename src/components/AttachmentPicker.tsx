"use client";

import { useRef, useState } from "react";
import { Camera, FileText, Paperclip, X } from "lucide-react";

/**
 * Pick receipts / documents from the device or take a photo with the camera.
 * On phones, the "Take photo" button opens the camera directly.
 * Files are submitted with the surrounding form under the field name "files".
 */
export function AttachmentPicker({ name = "files" }: { name?: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const store = useRef<HTMLInputElement>(null);

  const add = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...files, ...Array.from(list)];
    setFiles(next);
    // Mirror the combined selection into the input that is actually submitted.
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    if (store.current) store.current.files = dt.files;
  };

  const remove = (i: number) => {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    if (store.current) store.current.files = dt.files;
  };

  return (
    <div>
      <input ref={store} type="file" name={name} multiple className="hidden" />
      <div className="flex flex-wrap gap-2">
        <label className="btn-secondary cursor-pointer">
          <Paperclip className="h-4 w-4" /> Attach file
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <label className="btn-secondary cursor-pointer">
          <Camera className="h-4 w-4" /> Take photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {files.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3">
          {files.map((f, i) => (
            <li key={i} className="relative flex w-28 flex-col items-center rounded-lg border border-slate-200 bg-white p-2">
              {f.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={URL.createObjectURL(f)} alt="" className="h-20 w-full rounded object-cover" />
              ) : (
                <FileText className="h-20 w-10 text-slate-400" />
              )}
              <span className="mt-1 w-full truncate text-center text-xs text-slate-600">{f.name}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute -right-2 -top-2 rounded-full border border-slate-200 bg-white p-0.5 text-slate-500 hover:text-red-600"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
