import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/Sidebar";
import { requireUser } from "@/lib/auth";
import { getChecklistGame, getChecklistProgress } from "@/lib/checklistsData";
import styles from "../checklists.module.css";
import { ChecklistView } from "./ChecklistView";

export const dynamic = "force-dynamic";

// Usado pelo título da aba e pela página: cache() faz uma busca só
const loadGame = cache(getChecklistGame);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const game = await loadGame(gameId);
  return { title: game ? `Checklist: ${game.name}` : "Checklist" };
}

export default async function ChecklistGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  const user = await requireUser();

  const game = await loadGame(gameId);
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
