import { redirect } from "next/navigation";
import { getOrganization } from "@/lib/org";
import { SetupForm } from "./SetupForm";

export const metadata = { title: "Set up your business" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (await getOrganization()) redirect("/");
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold text-white">B</div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome to Broadwing Accounting</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tell us a little about your business. Everything can be changed later in Settings.
        </p>
      </div>
      <SetupForm />
    </main>
  );
}
