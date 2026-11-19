import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/Sidebar";
import { AuthPrompt } from "@/components/AuthPrompt";
import { getUserFromCookies } from "@/lib/auth";
import { getChecklistGame, getChecklistProgress } from "@/lib/checklistsData";
import styles from "../checklists.module.css";
import { ChecklistView } from "./ChecklistView";

export const dynamic = "force-dynamic";

export default async function ChecklistGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  const user = await getUserFromCookies();
  if (!user) {
    return (
      <div className={styles.authFallback}>
        <Sidebar />
        <div className={styles.authWrap}>
          <AuthPrompt
            title="Entre para ver seu checklist"
            description="Faça login ou crie uma conta para acompanhar o progresso 100% dos seus jogos."
          />
        </div>
      </div>
    );
  }

  const game = await getChecklistGame(gameId);
  if (!game) notFound();

  const progress = await getChecklistProgress(user.id, game.id);

  return (
    <div className={styles.page}>
      <Sidebar />

      <div className={styles.main}>
        <MobileHeader title={game.name} />

        <main className={styles.content}>
          <Link href="/checklists" className={styles.back}>
            <ArrowLeft className={styles.iconSm} />
            Checklists
          </Link>

          <ChecklistView game={game} initialProgress={progress} />
        </main>
      </div>
    </div>
  );
}
