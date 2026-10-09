import { notFound } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";
import { PageHeader } from "@/components/PageHeader";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/org";
import { saveContact, setContactArchived } from "../actions";
import { ContactForm } from "../ContactForm";

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrganization();
  const contact = await db.contact.findFirst({ where: { id, organizationId: org.id } });
  if (!contact) notFound();
  return (
    <>
      <PageHeader
        title={contact.name}
        actions={
          <ActionButton action={setContactArchived.bind(null, contact.id, !contact.isArchived)}>
            {contact.isArchived ? "Restore" : "Archive"}
          </ActionButton>
        }
      />
      <ContactForm action={saveContact.bind(null, contact.id)} contact={contact} defaultType={contact.type} />
    </>
  );
}
