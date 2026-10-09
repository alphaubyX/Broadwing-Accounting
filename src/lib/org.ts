import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";

/**
 * Single-organization mode: the app works with the first organization.
 * When Broadwing's central identity arrives, this is the one place that will
 * resolve the organization from the signed-in user instead.
 */
export const getOrganization = cache(async () => {
  return db.organization.findFirst({ orderBy: { createdAt: "asc" }, include: { branding: true } });
});

export async function requireOrganization() {
  const org = await getOrganization();
  if (!org) redirect("/setup");
  return org;
}

export type OrganizationWithBranding = NonNullable<Awaited<ReturnType<typeof getOrganization>>>;
