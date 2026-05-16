import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/Sidebar'
import { CompletionBar } from '@/components/ui'
import { getGames } from '@/lib/sheets'

export default async function BacklogPage() {
  const games = await getGames()

  const backlog = games
    .filter((g) => g.accountStatus === 'Lost Account')
    .sort((a, b) => a.title.localeCompare(b.title))

  const byPlatform = {}
  for (const g of backlog) {
    if (!byPlatform[g.platform]) byPlatform[g.platform] = []
    byPlatform[g.platform].push(g)
  }

  const platinumCount = backlog.filter((g) => g.platinum).length

  return (
    <div className="flex min-h-screen bg-[#080a0f]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader title="Recovery Backlog" />

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">

            {/* Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="hidden md:block font-display font-bold text-3xl text-zinc-100 mb-1">Recovery Backlog</h1>
              <p className="text-zinc-600 text-sm">
                {backlog.length} games with lost accounts · {platinumCount} platinums to re-earn
              </p>
            </div>

            {/* Summary cards — compactos no mobile */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="bg-[#0f1117] border border-white/6 rounded-xl p-3 md:p-5">
                <p className="text-[10px] md:text-[11px] text-zinc-600 uppercase tracking-widest font-semibold mb-1 md:mb-2 leading-tight">To Recover</p>
                <p className="text-2xl md:text-3xl font-display font-bold text-red-400">{backlog.length}</p>
              </div>
              <div className="bg-[#0f1117] border border-white/6 rounded-xl p-3 md:p-5">
                <p className="text-[10px] md:text-[11px] text-zinc-600 uppercase tracking-widest font-semibold mb-1 md:mb-2 leading-tight">Plats Lost</p>
                <p className="text-2xl md:text-3xl font-display font-bold text-amber-400">{platinumCount}</p>
              </div>
              <div className="bg-[#0f1117] border border-white/6 rounded-xl p-3 md:p-5">
                <p className="text-[10px] md:text-[11px] text-zinc-600 uppercase tracking-widest font-semibold mb-1 md:mb-2 leading-tight">Platforms</p>
                <p className="text-2xl md:text-3xl font-display font-bold text-zinc-300">{Object.keys(byPlatform).length}</p>
              </div>
            </div>

            {/* Por plataforma */}
            <div className="flex flex-col gap-4 md:gap-6">
              {Object.entries(byPlatform)
                .sort(([, a], [, b]) => b.length - a.length)
                .map(([platform, platformGames]) => (
                  <div key={platform} className="bg-[#0f1117] border border-white/6 rounded-xl overflow-hidden">
                    {/* Platform header */}
                    <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-white/6 bg-white/2">
                      <h2 className="font-display font-bold text-sm text-zinc-300 uppercase tracking-wide">{platform}</h2>
                      <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                        {platformGames.length} game{platformGames.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Tabela no desktop */}
                    <table className="hidden md:table w-full text-sm">
                      <tbody>
                        {platformGames.map((g) => (
                          <tr key={g.id} className="border-b border-white/4 last:border-0 hover:bg-white/2 transition-colors">
                            <td className="px-5 py-3 w-8 text-center">
                              {g.platinum && <span className="text-sm">🏆</span>}
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-zinc-200">{g.title}</span>
                            </td>
                            <td className="px-5 py-3 w-48">
                              <CompletionBar value={g.completion} />
                            </td>
                            <td className="px-5 py-3 text-xs text-zinc-700 max-w-xs truncate">
                              {g.notes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Cards no mobile */}
                    <div className="md:hidden divide-y divide-white/4">
                      {platformGames.map((g) => (
                        <div key={g.id} className="px-4 py-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            {g.platinum && <span className="text-xs">🏆</span>}
                            <span className="text-sm text-zinc-200 font-medium">{g.title}</span>
                          </div>
                          <CompletionBar value={g.completion} />
                          {g.notes && (
                            <p className="text-xs text-zinc-600 mt-1.5 line-clamp-2">{g.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
