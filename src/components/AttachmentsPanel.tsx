import { FileText, Trash2 } from "lucide-react";
import type { Attachment } from "@prisma/client";
import { addAttachments, deleteAttachment } from "@/lib/actions/attachments";
import type { AttachTarget } from "@/lib/attachments";
import { ActionButton } from "./ActionButton";
import { AttachmentUpload } from "./AttachmentUpload";

export function AttachmentsPanel({ target, id, attachments }: { target: AttachTarget; id: string; attachments: Attachment[] }) {
  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-slate-900">Receipts & attachments</h2>
      {attachments.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {attachments.map((a) => (
            <li key={a.id} className="group relative rounded-lg border border-slate-200 p-2">
              <a href={`/api/files/${a.id}`} target="_blank" rel="noreferrer" className="block">
                {a.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/files/${a.id}`} alt={a.fileName} className="h-28 w-full rounded object-cover" />
                ) : (
                  <div className="flex h-28 items-center justify-center rounded bg-slate-50">
                    <FileText className="h-10 w-10 text-slate-400" />
                  </div>
                )}
                <div className="mt-1 truncate text-xs text-slate-600">{a.fileName}</div>
              </a>
              <div className="absolute right-1 top-1 opacity-0 transition group-hover:opacity-100">
                <ActionButton action={deleteAttachment.bind(null, a.id)} confirm="Delete this attachment?" className="btn-danger px-2 py-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <AttachmentUpload action={addAttachments.bind(null, target, id)} />
      </div>
    </section>
  );
}
