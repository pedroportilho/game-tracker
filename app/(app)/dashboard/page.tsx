// Dashboard page dependencies and reusable UI components
import { getGames } from "@/lib/gamesData";
import { PageContent, KpiStrip, Kpi } from "@/components/layout/Page";
import { requireUser } from "@/lib/auth";
import { RecentCarousel } from "@/components/RecentCarousel";
import { GenreThemeChart } from "./GenreThemeChart";
import { StatusDonut } from "./StatusDonut";
import {
  ACCOUNT_STATUS_LABELS,
  GENRE_LABELS,
  THEME_LABELS,
  labelFor,
  formatPercent,
} from "@/lib/constants";
import styles from "./dashboard.module.css";

// Force the page to be rendered dynamically for each request
export const dynamic = "force-dynamic";
export const metadata = { title: "Estatísticas" };

// Fetch and aggregate dashboard statistics from the user's game list
async function getDashboardData(userId: string) {
  const games = await getGames(userId);

  const total = games.length;
  const withCompletion = games.filter((g) => g.completion != null);
  const avgCompletion = withCompletion.length
    ? withCompletion.reduce((sum, g) => sum + g.completion, 0) /
      withCompletion.length
    : 0;
  const platCount = games.filter((g) => g.platinum).length;
  const platRate = total ? platCount / total : 0;
  const lostCount = games.filter((g) => g.account_status === "Lost").length;
  const preservedCount = games.filter(
    (g) => g.account_status === "Preserved",
  ).length;
  const reEarnedCount = games.filter(
    (g) => g.account_status === "Re-earned",
  ).length;
  const unverifiedCount = games.filter(
    (g) => g.account_status === "Unverified",
  ).length;
  const completed = games.filter((g) => g.game_status === "Completed").length;

  const buckets = {
    Dropped: 0,
    "On Hold": 0,
    Playing: 0,
    Completed: 0,
    Backlog: 0,
  };
  for (const g of games) {
    const p = g.game_status;
    if (p === "Backlog") buckets["Backlog"]++;
    else if (p === "Dropped") buckets["Dropped"]++;
    else if (p === "On Hold") buckets["On Hold"]++;
    else if (p === "Playing") buckets["Playing"]++;
    else if (p === "Completed") buckets["Completed"]++;
  }

  const genreMap: Record<string, { finished: number; platinum: number }> = {};
  for (const g of games) {
    for (const genre of g.genres) {
      if (!genreMap[genre]) genreMap[genre] = { finished: 0, platinum: 0 };
      genreMap[genre].finished++;
      if (g.platinum) genreMap[genre].platinum++;
    }
  }

  const genreStats = Object.entries(genreMap)
    .map(([genre, s]) => ({
      genre: labelFor(GENRE_LABELS, genre),
      finished: s.finished,
      platinum: s.platinum,
      rate: s.finished ? s.platinum / s.finished : 0,
    }))
    .sort((a, b) => b.finished - a.finished)
    .slice(0, 6);

  const themeMap: Record<string, { finished: number; platinum: number }> = {};
  for (const g of games) {
    for (const theme of g.themes ?? []) {
      if (!themeMap[theme]) themeMap[theme] = { finished: 0, platinum: 0 };
      themeMap[theme].finished++;
      if (g.platinum) themeMap[theme].platinum++;
    }
  }

  const themeStats = Object.entries(themeMap)
    .map(([theme, s]) => ({
      theme: labelFor(THEME_LABELS, theme),
      finished: s.finished,
      platinum: s.platinum,
      rate: s.finished ? s.platinum / s.finished : 0,
    }))
    .sort((a, b) => b.finished - a.finished)
    .slice(0, 6);

  const platformMap: Record<string, number> = {};
  for (const g of games) {
    platformMap[g.platform] = (platformMap[g.platform] ?? 0) + 1;
  }

  const platformStats = Object.entries(platformMap)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Recent activity is sorted by date descending and limited for the dashboard view
  const recent = games
    .filter((g) => g.date)
    .sort((a, b) => {
      const pa = new Date(a.date).getTime();
      const pb = new Date(b.date).getTime();
      return (isNaN(pb) ? 0 : pb) - (isNaN(pa) ? 0 : pa);
    })
    .slice(0, 9);

  return {
    total,
    avgCompletion,
    platRate,
    platCount,
    lostCount,
    preservedCount,
    reEarnedCount,
    completed,
    buckets,
    genreStats,
    themeStats,
    platformStats,
    recent,
    unverifiedCount,
  };
}

export default async function DashboardPage() {
  const user = await requireUser();

  const d = await getDashboardData(user.id);

  // Valores derivados só para exibição
  const completedPct = formatPercent(d.total ? d.completed / d.total : 0);
  const platPct = formatPercent(d.platRate);
  const avgPct = formatPercent(d.avgCompletion);
  const maxPlatform = d.platformStats[0]?.count || 1;

  const accountSegments = [
    { key: "Preserved", value: d.preservedCount, tone: styles.tGreen },
    { key: "Re-earned", value: d.reEarnedCount, tone: styles.tBlue },
    { key: "Unverified", value: d.unverifiedCount, tone: styles.tLime },
    { key: "Lost", value: d.lostCount, tone: styles.tRed },
  ].map((s) => ({ ...s, label: labelFor(ACCOUNT_STATUS_LABELS, s.key) }));

  return (
    <PageContent width="full">
      {/* ── Números grandes, sem caixas ── */}
      <KpiStrip columns={4}>
        <Kpi label="Total de jogos" value={d.total} sub="na sua coleção" />
        <Kpi
          label="Concluídos"
          value={`${completedPct}%`}
          sub={`${d.completed} ${d.completed === 1 ? "jogo" : "jogos"}`}
          tone="mint"
        />
        <Kpi
          label="Taxa de platina"
          value={`${platPct}%`}
          sub={`${d.platCount} ${d.platCount === 1 ? "platina" : "platinas"}`}
          tone="blue"
        />
        <Kpi label="Progresso médio" value={`${avgPct}%`} sub="dos jogos com progresso" />
      </KpiStrip>

      {/* ── Layout: coluna principal + rail ── */}
      <div className={styles.layout}>
        {/* Coluna principal */}
        <div className={styles.primary}>
          <section className={styles.recentSection}>
            <p className={styles.sectionTitle}>Atividade recente</p>
            <RecentCarousel games={d.recent} />
          </section>

          <GenreThemeChart
            genreStats={d.genreStats}
            themeStats={d.themeStats}
          />
        </div>

        {/* Rail lateral */}
        <aside className={styles.rail}>
          <section className={styles.block}>
            <p className={styles.sectionTitle}>Status</p>
            <StatusDonut buckets={d.buckets} total={d.total} />
          </section>

          <section className={styles.block}>
            <p className={styles.sectionTitle}>Status da conta</p>
            <div className={styles.segBar}>
              {accountSegments.map((s) =>
                s.value > 0 ? (
                  <span
                    key={s.key}
                    className={s.tone}
                    style={{ flexGrow: s.value }}
                  />
                ) : null,
              )}
            </div>
            <ul className={styles.segLegend}>
              {accountSegments.map((s) => (
                <li key={s.key} className={styles.segItem}>
                  <span className={`${styles.segDot} ${s.tone}`} />
                  <span>{s.label}</span>
                  <span className={styles.segCount}>{s.value}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.block}>
            <p className={styles.sectionTitle}>Principais plataformas</p>
            <ul className={styles.rankList}>
              {d.platformStats.map((platform) => {
                const width = Math.round(
                  (platform.count / maxPlatform) * 100,
                );
                return (
                  <li key={platform.platform} className={styles.rankRow}>
                    <span
                      className={styles.rankLabel}
                      title={platform.platform}
                    >
                      {platform.platform}
                    </span>
                    <div className={styles.rankTrack}>
                      <div
                        className={styles.rankFill}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className={styles.rankNums}>
                      {platform.count}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </PageContent>
  );
}
