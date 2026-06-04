// Dashboard page dependencies and reusable UI components
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/Sidebar'
import { CompletionBar, StatCard } from '@/components/ui'
import { AuthPrompt } from '@/components/AuthPrompt'
import { getGames } from '@/lib/supabase'
import { getUserFromCookies } from '@/lib/auth'
import { formatGameDate } from '@/lib/constants'
import { StatusBadge } from '@/components/ui'
import styles from './dashboard.module.css'

// Force the page to be rendered dynamically for each request
export const dynamic = 'force-dynamic'

// Fetch and aggregate dashboard statistics from the user's game list
async function getDashboardData(userId: string) {
  const games = await getGames(userId)

  const total = games.length
  const withCompletion = games.filter((g) => g.completion != null)
  const avgCompletion = withCompletion.length
    ? withCompletion.reduce((sum, g) => sum + g.completion, 0) / withCompletion.length
    : 0
  const platCount = games.filter((g) => g.platinum).length
  const platRate = total ? platCount / total : 0
  const lostCount = games.filter((g) => g.account_status === 'Lost').length
  const preservedCount = games.filter((g) => g.account_status === 'Preserved').length
  const reEarnedCount = games.filter((g) => g.account_status === 'Re-earned').length
  const unverifiedCount = games.filter((g) => g.account_status === 'Unverified').length
  const completed = games.filter((g) => g.game_status === 'Completed').length

  const buckets = { 'Dropped': 0, 'On Hold': 0, 'Playing': 0, 'Completed': 0, 'Backlog': 0 }
  for (const g of games) {
    const p = g.game_status;
    if (p === "Backlog") buckets['Backlog']++
    else if (p === "Dropped") buckets['Dropped']++
    else if (p === "On Hold") buckets['On Hold']++
    else if (p === "Playing") buckets['Playing']++
    else if (p === "Completed") buckets['Completed']++
  }

  const genreMap: Record<string, { finished: number; platinum: number }> = {}
  for (const g of games) {
    for (const genre of g.genres) {
      if (!genreMap[genre]) genreMap[genre] = { finished: 0, platinum: 0 }
      genreMap[genre].finished++
      if (g.platinum) genreMap[genre].platinum++
    }
  }

  const genreStats = Object.entries(genreMap)
    .map(([genre, s]) => ({ genre, finished: s.finished, platinum: s.platinum, rate: s.finished ? s.platinum / s.finished : 0 }))
    .sort((a, b) => b.finished - a.finished)

  const platformMap: Record<string, number> = {}
  for (const g of games) {
    platformMap[g.platform] = (platformMap[g.platform] ?? 0) + 1
  }
  
  const platformStats = Object.entries(platformMap)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Recent activity is sorted by date descending and limited for the dashboard view
  const recent = games
    .filter((g) => g.date)
    .sort((a, b) => {
      const pa = new Date(a.date).getTime()
      const pb = new Date(b.date).getTime()
      return (isNaN(pb) ? 0 : pb) - (isNaN(pa) ? 0 : pa)
    })
    .slice(0, 8)

  return {
    total, avgCompletion, platRate, platCount,
    lostCount, preservedCount, reEarnedCount,
    completed, buckets, genreStats, platformStats, 
    recent, unverifiedCount,
  }
}

export default async function DashboardPage() {
  const user = await getUserFromCookies()

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
    )
  }

  const d = await getDashboardData(user.id)

  return (
    <div className={styles.dashboardPage}>
      <Sidebar />

      <div className={styles.dashboardMain}>
        <MobileHeader title="Dashboard" />

        <main className={styles.dashboardContent}>
          <div className={styles.dashboardGrid}>
            {/* Main dashboard summary card */}

              <div className={styles.dashboardHeader}>
                <div>
                  <h1 className={styles.dashboardTitle}>Dashboard</h1>
                  <p className={styles.dashboardSubtitle}>{d.total} games tracked across all platforms</p>
                </div>
              </div>

              <div className={styles.dashboardStatsSection}>
                {/* Primary stats row with the main metrics */}
                <div className={styles.dashboardPrimaryStats}>
                  <StatCard label="Total Games" value={d.total} />
                  <StatCard label="Completed" value={d.completed} sub={`${d.total ? `${Math.round((d.completed / d.total) * 100)}% of library` : '0% of library'}`} />
                  <StatCard label="Platinum Rate" value={`${Math.round(d.platRate * 100)}%`} sub={`${d.platCount} platinums`} accent />
                  <StatCard label="Avg Completion" value={`${Math.round(d.avgCompletion * 100)}%`} />
                </div>

                {/* Secondary status cards for account state counts */}
                <div className={styles.dashboardSecondaryStats}>
                  <div className={styles.statusCard}>
                    <p className={styles.statusLabel}>Preserved</p>
                    <p className={`${styles.statusValue} ${styles.statusValueGreen}`}>{d.preservedCount}</p>
                  </div>
                  <div className={styles.statusCard}>
                    <p className={styles.statusLabel}>Re-earned</p>
                    <p className={`${styles.statusValue} ${styles.statusValueBlue}`}>{d.reEarnedCount}</p>
                  </div>
                  <div className={styles.statusCard}>
                    <p className={styles.statusLabel}>Unverified</p>
                    <p className={`${styles.statusValue} ${styles.statusValueZinc}`}>{d.unverifiedCount}</p>
                  </div>
                  <div className={styles.statusCard}>
                    <p className={styles.statusLabel}>Lost</p>
                    <p className={`${styles.statusValue} ${styles.statusValueRed}`}>{d.lostCount}</p>
                  </div>
                </div>
              </div>


            {/* Distribution and platform visualizations */}
            <section className={styles.gridTwoColumns}>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <p className={styles.sectionTitle}>Status distribution</p>
                </div>
                <div className={styles.chartGroup}>
                  {Object.entries(d.buckets).map(([label, count]) => {
                    const percent = (count / d.total);
                    
                    return (
                      <div key={label} className={styles.chartItem}>
                        <div className={styles.chartLabel}>{label}</div>
                        <div className={styles.chartBar}>
                          <CompletionBar value={percent} showLabel={false} />
                        </div>
                        <div className={styles.chartValue}>{count}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={styles.chartCard}>
                <p className={styles.sectionTitle}>Top platforms</p>
                <div className={styles.chartGroup}>
                  {d.platformStats.map((platform) => {
                    const maxCount = d.platformStats[0]?.count || 1
                    const width = Math.round((platform.count / maxCount) * 100)
                    return (
                      <div key={platform.platform} className={styles.chartItem}>

                          <div className={styles.chartLabel}>{platform.platform}</div>
                          <div className={styles.chartBar}>
                            <div className={styles.chartBarFill} style={{ width: `${width}%` }} />
                          </div>
                          <div className={styles.chartValue}>{platform.count}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Recent activity timeline shown prior to genre details */}
            <section className={styles.recentSection}>
              <p className={styles.sectionTitle}>Recent activity</p>
              <div className={styles.recentList}>
                {d.recent.map((game) => (
                  <div key={game.id} className={styles.recentItem}>
                    <div className={styles.recentText}>
                      <p className={styles.recentTitle}>{game.title}</p>
                      <p className={styles.recentMeta}>{game.platform} · {formatGameDate(game.date)}</p>
                    </div>
                    <StatusBadge status={game.account_status} />
                  </div>
                ))}
              </div>
            </section>

            {/* Genre breakdown table shown after recent activity */}
            <section className={styles.genreSection}>
              <div className={styles.chartHeader}>
                <p className={styles.sectionTitle}>Genre Breakdown</p>
              </div>
              <div className={styles.genreTable}>
                <div className={styles.genreHeader}>
                  <span>Genre</span>
                  <span className={styles.genreCellRight}>Games</span>
                  <span className={styles.genreCellRight}>Platinum</span>
                  <span className={styles.genreCellRight}>Plat rate</span>
                </div>
                <div>
                  {d.genreStats.map((genre) => (
                    <div key={genre.genre} className={styles.genreRow}>
                      <span>{genre.genre}</span>
                      <span className={styles.genreCellRight}>{genre.finished}</span>
                      <span className={styles.genreCellRight}>{Math.round(genre.platinum)}</span>
                      <span className={styles.genreCellRate}>{Math.round(genre.rate * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
