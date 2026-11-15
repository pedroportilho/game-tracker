import Link from "next/link";
import { Trophy } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/Sidebar";
import { CompletionBar } from "@/components/ui";
import { AuthPrompt } from "@/components/AuthPrompt";
import { getBacklog, type Game } from "@/lib/supabase";
import { getUserFromCookies } from "@/lib/auth";
import styles from "./backlog.module.css";

export const dynamic = "force-dynamic";

export default async function BacklogPage() {
  const user = await getUserFromCookies();
  if (!user) {
    return (
      <div className={styles.authFallback}>
        <Sidebar />
        <div className={styles.authWrap}>
          <AuthPrompt
            title="Entre para ver seu backlog"
            description="Faça login ou crie uma conta para acessar a lista de jogos perdidos e sua recuperação."
          />
        </div>
      </div>
    );
  }

  const games = await getBacklog(user.id);
  const backlog = games.sort((a, b) => a.title.localeCompare(b.title));

  const byPlatform: Record<string, Game[]> = {};
  for (const g of backlog) {
    if (!byPlatform[g.platform]) byPlatform[g.platform] = [];
    byPlatform[g.platform].push(g);
  }

  const platinumCount = backlog.filter((g) => g.platinum).length;
  const platforms = Object.entries(byPlatform).sort(
    ([, a], [, b]) => b.length - a.length,
  );

  return (
    <div className={styles.backlogPage}>
      <Sidebar />

      <div className={styles.main}>
        <MobileHeader title="Recovery Backlog" />

        <main className={styles.content}>
          {/* ── Header ── */}
          <header className={styles.header}>
            <h1 className={styles.pageTitle}>Recovery Backlog</h1>
            <p className={styles.subtitle}>
              {backlog.length} games with lost accounts · {platinumCount}{" "}
              platinums to re-earn
            </p>
          </header>

          {/* ── Faixa de números ── */}
          <section className={styles.kpiStrip}>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>To recover</span>
              <span className={`${styles.kpiValue} ${styles.kpiValueRed}`}>
                {backlog.length}
              </span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Plats lost</span>
              <span className={`${styles.kpiValue} ${styles.kpiValueMint}`}>
                {platinumCount}
              </span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Platforms</span>
              <span className={styles.kpiValue}>{platforms.length}</span>
            </div>
          </section>

          {/* ── Por plataforma ── */}
          {platforms.length === 0 ? (
            <p className={styles.empty}>No games with lost accounts</p>
          ) : (
            <div className={styles.groups}>
              {platforms.map(([platform, platformGames]) => (
                <section key={platform} className={styles.group}>
                  <div className={styles.groupHead}>
                    <h2 className={styles.platform}>{platform}</h2>
                    <p className={styles.platformCount}>
                      {platformGames.length} game
                      {platformGames.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <ul className={styles.list}>
                    {platformGames.map((g) => (
                      <li key={g.id} className={styles.row}>
                        <Link href={`/games/${g.id}`} className={styles.title}>
                          {g.title}
                        </Link>

                        {g.platinum && (
                          <Trophy
                            className={styles.trophy}
                            aria-label="Platinum"
                          />
                        )}

                        <div className={styles.bar}>
                          <CompletionBar value={g.completion} />
                        </div>

                        {g.notes && (
                          <p className={styles.notes} title={g.notes}>
                            {g.notes}
                          </p>
                        )}
                      </li>
                    ))}
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
