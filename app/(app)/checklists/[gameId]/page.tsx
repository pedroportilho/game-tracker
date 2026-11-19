import { cache } from "react";
import { PageContent } from "@/components/layout/Page";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

  // A estrutura do jogo e o progresso não dependem um do outro: busca juntos
  const [game, progress] = await Promise.all([
    loadGame(gameId),
    getChecklistProgress(user.id, gameId),
  ]);
  if (!game) notFound();

  return (
    <PageContent>
      <Link href="/checklists" className={styles.back}>
        <ArrowLeft className={styles.iconSm} />
        Checklists
      </Link>

      <ChecklistView game={game} initialProgress={progress} />
    </PageContent>
  );
}
