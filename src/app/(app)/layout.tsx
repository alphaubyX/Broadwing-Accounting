import { Sidebar } from "@/components/Sidebar";
import { requireOrganization } from "@/lib/org";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const org = await requireOrganization();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar orgName={org.name} hasLogo={!!org.logoPath} />
      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</div>
      </main>
    </div>
  );
}
