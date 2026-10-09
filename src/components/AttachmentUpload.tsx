"use client";

import { useActionState, useEffect, useState } from "react";
import type { ActionState } from "@/lib/forms";
import { AttachmentPicker } from "./AttachmentPicker";
import { FormError } from "./FormError";
import { SubmitButton } from "./SubmitButton";

export function AttachmentUpload({ action }: { action: (state: ActionState, fd: FormData) => Promise<ActionState> }) {
  const [state, formAction] = useActionState(action, {});
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (state.ok) setKey((k) => k + 1); // clear the picker after a successful upload
  }, [state]);
  return (
    <form action={formAction} className="space-y-3">
      <FormError error={state.error} />
      <AttachmentPicker key={key} />
      <SubmitButton pendingText="Uploading…" className="btn-primary">
        Upload
      </SubmitButton>
    </form>
  );
}
