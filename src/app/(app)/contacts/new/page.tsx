import { PageHeader } from "@/components/PageHeader";
import { saveContact } from "../actions";
import { ContactForm } from "../ContactForm";

export const metadata = { title: "New contact" };

export default async function NewContactPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "CUSTOMER" } = await searchParams;
  return (
    <>
      <PageHeader title="New contact" />
      <ContactForm action={saveContact.bind(null, null)} defaultType={type} />
    </>
  );
}
