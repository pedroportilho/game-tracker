// Dashboard page dependencies and reusable UI components
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/Sidebar'
import { StatCard } from '@/components/ui'
import { AuthPrompt } from '@/components/AuthPrompt'
import { getGames } from '@/lib/supabase'
import { getUserFromCookies } from '@/lib/auth'
import { RecentCarousel } from '@/components/RecentCarousel'
import { GenreThemeChart } from './GenreThemeChart'
import { StatusDonut } from './StatusDonut'
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
    .sort((a, b) => b.finished - a.finished).slice(0, 6)

  const themeMap: Record<string, { finished: number; platinum: number }> = {}
  for (const g of games) {
    for (const theme of (g.themes ?? [])) {
      if (!themeMap[theme]) themeMap[theme] = { finished: 0, platinum: 0 }
      themeMap[theme].finished++
      if (g.platinum) themeMap[theme].platinum++
    }
  }

  const themeStats = Object.entries(themeMap)
    .map(([theme, s]) => ({ theme, finished: s.finished, platinum: s.platinum, rate: s.finished ? s.platinum / s.finished : 0 }))
    .sort((a, b) => b.finished - a.finished).slice(0, 6)

  const platformMap: Record<string, number> = {}
  for (const g of games) {
    platformMap[g.platform] = (platformMap[g.platform] ?? 0) + 1
  }

  const platformStats = Object.entries(platformMap)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Recent activity is sorted by date descending and limited for the dashboard view
  const recent = games
    .filter((g) => g.date)
    .sort((a, b) => {
      const pa = new Date(a.date).getTime()
      const pb = new Date(b.date).getTime()
      return (isNaN(pb) ? 0 : pb) - (isNaN(pa) ? 0 : pa)
    })
    .slice(0, 9)

  return {
    total, avgCompletion, platRate, platCount,
    lostCount, preservedCount, reEarnedCount,
    completed, buckets, genreStats, themeStats, platformStats,
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

          {/* ── Row 1: Page title ── */}
          <div className={styles.dashboardHeader}>
            <h1 className={styles.dashboardTitle}>Dashboard</h1>
            <p className={styles.dashboardSubtitle}>{d.total} games tracked</p>
          </div>

          {/* ── Row 2: Stat cards ── */}
          <div className={styles.topBar}>
            {/* Primary stats */}
            <StatCard label="Total Games" value={d.total} />
            <StatCard
              label="Completed"
              value={d.completed}
              sub={`${d.total ? `${Math.round((d.completed / d.total) * 100)}%` : '0%'} of library`}
            />
            <StatCard
              label="Platinum Rate"
              value={`${Math.round(d.platRate * 100)}%`}
              sub={`${d.platCount} platinums`}
              accent
            />
            <StatCard label="Avg Completion" value={`${Math.round(d.avgCompletion * 100)}%`} />

            {/* Account-status mini cards */}
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

          {/* ── Row 3: Recent activity carousel ── */}
          <section className={styles.recentSection}>
            <p className={styles.sectionTitle}>Recent activity</p>
            <RecentCarousel games={d.recent} />
          </section>

          {/* ── Row 4: Three-column grid ── */}
          <div className={styles.bottomGrid}>

            {/* Col 1: Status donut */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <p className={styles.sectionTitle}>Status distribution</p>
              </div>
              <StatusDonut buckets={d.buckets} total={d.total} />
            </div>

            {/* Col 2: Top platforms */}
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

            {/* Col 3: Genre / Theme breakdown */}
            <GenreThemeChart genreStats={d.genreStats} themeStats={d.themeStats} />

          </div>

        </main>
      </div>
    </div>
  )
}
