import { PageContent, PageHeader } from "@/components/layout/Page";
import { requireUser } from "@/lib/auth";
import { SettingsView } from "./SettingsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <PageContent width="narrow">
      <PageHeader
        title="Configurações"
        subtitle="Salvas na sua conta: valem em todos os seus aparelhos."
      />
      <SettingsView initial={user.settings} isAdmin={user.isAdmin} />
    </PageContent>
  );
}
