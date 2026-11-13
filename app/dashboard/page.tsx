// Dashboard page dependencies and reusable UI components
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/Sidebar";
import { AuthPrompt } from "@/components/AuthPrompt";
import { getGames } from "@/lib/supabase";
import { getUserFromCookies } from "@/lib/auth";
import { RecentCarousel } from "@/components/RecentCarousel";
import { GenreThemeChart } from "./GenreThemeChart";
import { StatusDonut } from "./StatusDonut";
import styles from "./dashboard.module.css";

// Force the page to be rendered dynamically for each request
export const dynamic = "force-dynamic";

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
      genre,
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
      theme,
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
  const user = await getUserFromCookies();

  // If the user is not authenticated, show a prompt instead of the dashboard
  if (!user) {
    return (
      <div className={styles.authFallback}>
        <Sidebar />
        <div className={styles.authPromptWrapper}>
          <AuthPrompt
            title="Acesse sua conta"
            description="Entre ou crie uma conta para ver seu dashboard pessoal, estatísticas e progresso."
          />
        </div>
      </div>
    );
  }

  const d = await getDashboardData(user.id);

  // Valores derivados só para exibição
  const completedPct = d.total ? Math.round((d.completed / d.total) * 100) : 0;
  const platPct = Math.round(d.platRate * 100);
  const avgPct = Math.round(d.avgCompletion * 100);
  const maxPlatform = d.platformStats[0]?.count || 1;

  const accountSegments = [
    { label: "Preserved", value: d.preservedCount, tone: styles.tGreen },
    { label: "Re-earned", value: d.reEarnedCount, tone: styles.tBlue },
    { label: "Unverified", value: d.unverifiedCount, tone: styles.tLime },
    { label: "Lost", value: d.lostCount, tone: styles.tRed },
  ];

  return (
    <div className={styles.dashboardPage}>
      <Sidebar />

      <div className={styles.dashboardMain}>
        <MobileHeader title="Dashboard" />

        <main className={styles.dashboardContent}>
          {/* ── KPI strip: números grandes, sem caixas ── */}
          <section className={styles.kpiStrip}>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Total games</span>
              <span className={styles.kpiValue}>{d.total}</span>
              <span className={styles.kpiSub}>in your library</span>
            </div>

            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Completed</span>
              <span className={`${styles.kpiValue} ${styles.kpiValueMint}`}>
                {completedPct}%
              </span>
              <span className={styles.kpiSub}>{d.completed} games</span>
            </div>

            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Platinum rate</span>
              <span className={`${styles.kpiValue} ${styles.kpiValueBlue}`}>
                {platPct}%
              </span>
              <span className={styles.kpiSub}>{d.platCount} platinums</span>
            </div>

            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Avg completion</span>
              <span className={styles.kpiValue}>{avgPct}%</span>
              <span className={styles.kpiSub}>across rated games</span>
            </div>
          </section>

          {/* ── Layout: coluna principal + rail ── */}
          <div className={styles.layout}>
            {/* Coluna principal */}
            <div className={styles.primary}>
              <section className={styles.recentSection}>
                <p className={styles.sectionTitle}>Recent activity</p>
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
                <p className={styles.sectionTitle}>Account status</p>
                <div className={styles.segBar}>
                  {accountSegments.map((s) =>
                    s.value > 0 ? (
                      <span
                        key={s.label}
                        className={s.tone}
                        style={{ flexGrow: s.value }}
                      />
                    ) : null,
                  )}
                </div>
                <ul className={styles.segLegend}>
                  {accountSegments.map((s) => (
                    <li key={s.label} className={styles.segItem}>
                      <span className={`${styles.segDot} ${s.tone}`} />
                      <span>{s.label}</span>
                      <span className={styles.segCount}>{s.value}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={styles.block}>
                <p className={styles.sectionTitle}>Top platforms</p>
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
        </main>
      </div>
    </div>
  );
}
