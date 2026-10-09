"use server";

import { redirect } from "next/navigation";
import { getOrganization } from "@/lib/org";
import { createOrganization } from "@/lib/setup";
import { handle, required, str, UserError, type ActionState } from "@/lib/forms";

export async function setupOrganization(_: ActionState, fd: FormData): Promise<ActionState> {
  const state = await handle(async () => {
    if (await getOrganization()) throw new UserError("An organization is already set up.");
    const taxRate = str(fd, "taxRate");
    const rate = taxRate ? Number(taxRate) : null;
    if (rate !== null && (!Number.isFinite(rate) || rate < 0 || rate > 100)) throw new UserError("Tax rate must be between 0 and 100.");
    await createOrganization({
      name: required(fd, "name", "Business name"),
      currency: required(fd, "currency", "Currency").toUpperCase(),
      country: str(fd, "country"),
      taxName: str(fd, "taxName"),
      taxRate: rate,
      data: {
        legalName: str(fd, "legalName"),
        email: str(fd, "email"),
        phone: str(fd, "phone"),
        addressLine1: str(fd, "addressLine1"),
        city: str(fd, "city"),
        taxNumber: str(fd, "taxNumber"),
      },
    });
  });
  if (state.ok) redirect("/settings?welcome=1");
  return state;
}
