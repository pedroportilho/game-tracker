import Link from "next/link";
import { Trophy } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/Sidebar";
import { ProgressBar } from "@/components/ui";
import { getBacklog, type Game } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import styles from "./backlog.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recuperação" };

export default async function BacklogPage() {
  const user = await requireUser();

  const games = await getBacklog(user.id);
  const backlog = games.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

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
        <MobileHeader title="Recuperação" />

        <main className={styles.content}>
          {/* ── Header ── */}
          <header className={styles.header}>
            <h1 className={styles.pageTitle}>Recuperação</h1>
            <p className={styles.subtitle}>
              {backlog.length} {backlog.length === 1 ? "jogo" : "jogos"} em
              contas perdidas · {platinumCount}{" "}
              {platinumCount === 1 ? "platina" : "platinas"} para reconquistar
            </p>
          </header>

          {/* ── Faixa de números ── */}
          <section className={styles.kpiStrip}>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>A recuperar</span>
              <span className={`${styles.kpiValue} ${styles.kpiValueRed}`}>
                {backlog.length}
              </span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Platinas perdidas</span>
              <span className={`${styles.kpiValue} ${styles.kpiValueMint}`}>
                {platinumCount}
              </span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Plataformas</span>
              <span className={styles.kpiValue}>{platforms.length}</span>
            </div>
          </section>

          {/* ── Por plataforma ── */}
          {platforms.length === 0 ? (
            <p className={styles.empty}>Nenhum jogo em contas perdidas</p>
          ) : (
            <div className={styles.groups}>
              {platforms.map(([platform, platformGames]) => (
                <section key={platform} className={styles.group}>
                  <div className={styles.groupHead}>
                    <h2 className={styles.platform}>{platform}</h2>
                    <p className={styles.platformCount}>
                      {platformGames.length}{" "}
                      {platformGames.length === 1 ? "jogo" : "jogos"}
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
                            aria-label="Platinado"
                          />
                        )}

                        <div className={styles.bar}>
                          <ProgressBar value={g.completion} />
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
