import Link from "next/link";
import { PageContent, PageHeader } from "@/components/layout/Page";
import { requireUser } from "@/lib/auth";
import { getChecklistCatalog, getChecklistProgress } from "@/lib/checklistsData";
import {
  franchiseCompletion,
  gameCompletion,
} from "@/lib/checklists";
import { ProgressBar } from "@/components/ui";
import { formatPercent } from "@/lib/constants";
import styles from "./checklists.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checklists" };

export default async function ChecklistsPage() {
  const user = await requireUser();

  const [catalog, progress] = await Promise.all([
    getChecklistCatalog(),
    getChecklistProgress(user.id),
  ]);

  const totalGames = catalog.reduce((acc, f) => acc + f.games.length, 0);

  return (
    <PageContent>
      <PageHeader
        title="Checklists"
        subtitle={`${totalGames} ${totalGames === 1 ? "jogo" : "jogos"} em ${catalog.length} ${catalog.length === 1 ? "franquia" : "franquias"}`}
      />

      {catalog.length === 0 ? (
        <p className={styles.empty}>
          Nenhum checklist carregado ainda. Rode o schema e o seed no
          Supabase.
        </p>
      ) : (
        <div className={styles.groups}>
          {catalog.map((franchise) => (
            <section key={franchise.id} className={styles.group}>
              <div className={styles.groupHead}>
                <h2 className={styles.groupName}>{franchise.name}</h2>
                <p className={styles.groupMeta}>
                  <span className={styles.groupPct}>
                    {formatPercent(
                      franchiseCompletion(franchise.games, progress),
                    )}
                    %
                  </span>{" "}
                  no total
                </p>
              </div>

              <ul className={styles.gameList}>
                {franchise.games.map((game) => {
                  const c = gameCompletion(game, progress);
                  return (
                    <li key={game.id}>
                      <Link
                        href={`/checklists/${game.id}`}
                        className={styles.gameCard}
                        title={game.name}
                      >
                        {game.logo ? (
                          <img
                            src={game.logo}
                            alt={game.name}
                            loading="lazy"
                            className={styles.gameLogo}
                          />
                        ) : (
                          <span className={styles.gameLogoEmpty}>
                            {game.name}
                          </span>
                        )}
                        <ProgressBar value={c} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageContent>
  );
}
