import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/Sidebar";
import { AuthPrompt } from "@/components/AuthPrompt";
import { getUserFromCookies } from "@/lib/auth";
import { getChecklistCatalog, getChecklistProgress } from "@/lib/checklistsData";
import {
  franchiseCompletion,
  gameCompletion,
  formatPct,
} from "@/lib/checklists";
import styles from "./checklists.module.css";

export const dynamic = "force-dynamic";

export default async function ChecklistsPage() {
  const user = await getUserFromCookies();
  if (!user) {
    return (
      <div className={styles.authFallback}>
        <Sidebar />
        <div className={styles.authWrap}>
          <AuthPrompt
            title="Entre para ver seus checklists"
            description="Faça login ou crie uma conta para acompanhar o progresso 100% dos seus jogos."
          />
        </div>
      </div>
    );
  }

  const [catalog, progress] = await Promise.all([
    getChecklistCatalog(),
    getChecklistProgress(user.id),
  ]);

  const totalGames = catalog.reduce((acc, f) => acc + f.games.length, 0);

  return (
    <div className={styles.page}>
      <Sidebar />

      <div className={styles.main}>
        <MobileHeader title="Checklists" />

        <main className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.pageTitle}>Checklists</h1>
            <p className={styles.subtitle}>
              {totalGames} {totalGames === 1 ? "game" : "games"} in{" "}
              {catalog.length} {catalog.length === 1 ? "franchise" : "franchises"}
            </p>
          </header>

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
                        {formatPct(
                          franchiseCompletion(franchise.games, progress),
                        )}
                        %
                      </span>{" "}
                      overall
                    </p>
                  </div>

                  <ul className={styles.gameList}>
                    {franchise.games.map((game) => {
                      const c = gameCompletion(game, progress);
                      return (
                        <li key={game.id}>
                          <Link
                            href={`/checklists/${game.id}`}
                            className={styles.gameRow}
                          >
                            {game.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={game.logo}
                                alt=""
                                loading="lazy"
                                className={styles.gameLogo}
                              />
                            ) : (
                              <span className={styles.gameLogoEmpty} />
                            )}
                            <span className={styles.gameName}>{game.name}</span>
                            <span className={styles.gameProgress}>
                              <span className={styles.bar}>
                                <span
                                  className={`${styles.barFill} ${c >= 1 ? styles.barFillDone : ""}`}
                                  style={{ width: `${c * 100}%` }}
                                />
                              </span>
                              <span className={styles.pct}>
                                {formatPct(c)}%
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
