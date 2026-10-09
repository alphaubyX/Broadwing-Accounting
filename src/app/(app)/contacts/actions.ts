"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { handle, required, str, UserError, type ActionState } from "@/lib/forms";
import { requireOrganization } from "@/lib/org";

const TYPES = ["CUSTOMER", "VENDOR", "BOTH"] as const;

export async function saveContact(contactId: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  const state = await handle(async () => {
    const type = TYPES.find((t) => t === fd.get("type")) ?? "CUSTOMER";
    const data = {
      type,
      name: required(fd, "name", "Name"),
      email: str(fd, "email"),
      phone: str(fd, "phone"),
      address: str(fd, "address"),
      taxNumber: str(fd, "taxNumber"),
      notes: str(fd, "notes"),
    };
    if (contactId) {
      const c = await db.contact.findFirst({ where: { id: contactId, organizationId: org.id } });
      if (!c) throw new UserError("Contact not found.");
      await db.contact.update({ where: { id: c.id }, data });
    } else {
      await db.contact.create({ data: { ...data, organizationId: org.id } });
    }
  });
  if (!state.ok) return state;
  revalidatePath("/", "layout");
  redirect("/contacts");
}

export async function setContactArchived(contactId: string, isArchived: boolean): Promise<ActionState> {
  const org = await requireOrganization();
  const state = await handle(async () => {
    const res = await db.contact.updateMany({ where: { id: contactId, organizationId: org.id }, data: { isArchived } });
    if (res.count === 0) throw new UserError("Contact not found.");
  });
  revalidatePath("/", "layout");
  return state;
}
