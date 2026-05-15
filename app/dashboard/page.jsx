import { Sidebar } from '@/components/layout/Sidebar'
import { StatCard } from '@/components/ui'
import { getGames } from '@/lib/sheets'
import { formatGameDate } from '@/lib/constants'


async function getDashboardData() {
  const games = await getGames()

  const total = games.length
  const withCompletion = games.filter((g) => g.completion != null)
  const avgCompletion = withCompletion.length
    ? withCompletion.reduce((sum, g) => sum + g.completion, 0) / withCompletion.length
    : 0
  const platCount = games.filter((g) => g.platinum).length
  const platRate = total ? platCount / total : 0
  const lostCount = games.filter((g) => g.accountStatus === 'Lost Account').length
  const preservedCount = games.filter((g) => g.accountStatus === 'Preserved').length
  const reEarnedCount = games.filter((g) => g.accountStatus === 'Re-earned').length
  const completed = games.filter((g) => g.completion === 1).length
  const backlog = games.filter((g) => g.completion == null || g.completion < 1).length

  // Completion buckets
  const buckets = { '0–25%': 0, '26–50%': 0, '51–75%': 0, '76–99%': 0, '100%': 0, 'No data': 0 }
  for (const g of games) {
    if (g.completion == null) { buckets['No data']++; continue }
    const p = g.completion * 100
    if (p <= 25) buckets['0–25%']++
    else if (p <= 50) buckets['26–50%']++
    else if (p <= 75) buckets['51–75%']++
    else if (p < 100) buckets['76–99%']++
    else buckets['100%']++
  }

  // Genre stats
  const genreMap = {}
  for (const g of games) {
    for (const genre of g.genres) {
      if (!genreMap[genre]) genreMap[genre] = { finished: 0, platinum: 0 }
      genreMap[genre].finished++
      if (g.platinum) genreMap[genre].platinum++
    }
  }
  const genreStats = Object.entries(genreMap)
    .map(([genre, s]) => ({ genre, ...s, rate: s.finished ? s.platinum / s.finished : 0 }))
    .sort((a, b) => b.finished - a.finished)

  // Platform distribution
  const platformMap = {}
  for (const g of games) {
    platformMap[g.platform] = (platformMap[g.platform] ?? 0) + 1
  }
  const platformStats = Object.entries(platformMap)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Recent games (last 10 by date field if it's a year)
  const recent = games
    .filter((g) => g.date)
    .sort((a, b) => {
      // date is pre-formatted as 'Mon YYYY' — sort by parsing back to comparable value
      const pa = new Date(a.date)
      const pb = new Date(b.date)
      return (isNaN(pb) ? 0 : pb) - (isNaN(pa) ? 0 : pa)
    })
    .slice(0, 8)

  return {
    total, avgCompletion, platRate, platCount,
    lostCount, preservedCount, reEarnedCount,
    completed, backlog, buckets, genreStats, platformStats, recent,
  }
}

export default async function DashboardPage() {
  const d = await getDashboardData()

  return (
    <div className="flex min-h-screen bg-[#080a0f]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl text-zinc-100 mb-1">Dashboard</h1>
            <p className="text-zinc-600 text-sm">{d.total} games tracked across all platforms</p>
          </div>

          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Games" value={d.total} />
            <StatCard label="Completed" value={d.completed} sub={`${Math.round((d.completed / d.total) * 100)}% of library`} />
            <StatCard label="Platinum Rate" value={`${Math.round(d.platRate * 100)}%`} sub={`${d.platCount} platinums`} accent />
            <StatCard label="Avg Completion" value={`${Math.round(d.avgCompletion * 100)}%`} />
          </div>

          {/* Account status row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#0f1117] border border-white/6 rounded-xl p-5">
              <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-semibold mb-2">Preserved</p>
              <p className="text-2xl font-display font-bold text-emerald-400">{d.preservedCount}</p>
            </div>
            <div className="bg-[#0f1117] border border-white/6 rounded-xl p-5">
              <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-semibold mb-2">Lost Accounts</p>
              <p className="text-2xl font-display font-bold text-red-400">{d.lostCount}</p>
            </div>
            <div className="bg-[#0f1117] border border-white/6 rounded-xl p-5">
              <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-semibold mb-2">Re-earned</p>
              <p className="text-2xl font-display font-bold text-blue-400">{d.reEarnedCount}</p>
            </div>
          </div>

          {/* Completion buckets + genre stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* Completion distribution */}
            <div className="bg-[#0f1117] border border-white/6 rounded-xl p-5">
              <h2 className="font-display font-bold text-sm text-zinc-300 mb-4 uppercase tracking-wide">Completion Distribution</h2>
              <div className="flex flex-col gap-3">
                {Object.entries(d.buckets).map(([label, count]) => {
                  const pct = d.total ? Math.round((count / d.total) * 100) : 0
                  const color =
                    label === '100%' ? 'bg-violet-500' :
                    label === '76–99%' ? 'bg-emerald-500' :
                    label === '51–75%' ? 'bg-amber-500' :
                    label === 'No data' ? 'bg-zinc-700' : 'bg-zinc-600'
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500 w-14 text-right tabular-nums">{label}</span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500 w-8 tabular-nums">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top platforms */}
            <div className="bg-[#0f1117] border border-white/6 rounded-xl p-5">
              <h2 className="font-display font-bold text-sm text-zinc-300 mb-4 uppercase tracking-wide">Top Platforms</h2>
              <div className="flex flex-col gap-3">
                {d.platformStats.map(({ platform, count }) => {
                  const pct = d.total ? Math.round((count / d.total) * 100) : 0
                  return (
                    <div key={platform} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500 w-20 truncate">{platform}</span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full">
                        <div className="h-full rounded-full bg-violet-500/60" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500 w-8 tabular-nums">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Genre breakdown */}
          <div className="bg-[#0f1117] border border-white/6 rounded-xl p-5 mb-8">
            <h2 className="font-display font-bold text-sm text-zinc-300 mb-4 uppercase tracking-wide">Genre Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-zinc-600 uppercase tracking-widest border-b border-white/5">
                    <th className="text-left pb-3 font-semibold">Genre</th>
                    <th className="text-right pb-3 font-semibold">Games</th>
                    <th className="text-right pb-3 font-semibold">Platinum</th>
                    <th className="text-right pb-3 font-semibold">Plat. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {d.genreStats.map(({ genre, finished, platinum, rate }) => (
                    <tr key={genre} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                      <td className="py-2.5 text-zinc-300">{genre}</td>
                      <td className="py-2.5 text-right text-zinc-500 tabular-nums">{finished}</td>
                      <td className="py-2.5 text-right text-zinc-500 tabular-nums">{platinum}</td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span className={rate >= 0.8 ? 'text-violet-400' : rate >= 0.5 ? 'text-emerald-400' : 'text-zinc-500'}>
                          {Math.round(rate * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recently played */}
          <div className="bg-[#0f1117] border border-white/6 rounded-xl p-5">
            <h2 className="font-display font-bold text-sm text-zinc-300 mb-4 uppercase tracking-wide">Recent Activity</h2>
            <div className="flex flex-col gap-2">
              {d.recent.map((g) => {
                const date = formatGameDate(g.date)
                return (
                  <div key={g.id} className="flex items-center gap-4 py-2 border-b border-white/4 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{g.title}</p>
                      <p className="text-xs text-zinc-600">{g.platform} · {date ?? '—'}</p>
                    </div>
                    {g.platinum && <span className="text-sm">🏆</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-md border ${
                      g.accountStatus === 'Preserved' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700/20' :
                      g.accountStatus === 'Lost Account' ? 'bg-red-900/30 text-red-400 border-red-700/20' :
                      'bg-zinc-800 text-zinc-500 border-zinc-700/20'
                    }`}>{g.accountStatus}</span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
