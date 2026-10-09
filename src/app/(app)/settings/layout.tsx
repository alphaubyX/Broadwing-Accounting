import { PageHeader } from "@/components/PageHeader";
import { SettingsNav } from "./SettingsNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Settings" subtitle="Set up your business once — everything else just works." />
      <div className="grid gap-6 md:grid-cols-[210px_1fr]">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
