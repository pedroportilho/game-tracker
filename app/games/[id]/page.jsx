import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatusBadge, CompletionBar } from '@/components/ui'
import { getGameById } from '@/lib/sheets'
import { getGame, igdbImageUrl } from '@/lib/igdb'
import { formatGameDate } from '@/lib/constants'
import { ArrowLeft, ExternalLink, Calendar, Trophy } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function fetchIgdb(igdbId) {
  if (!igdbId) return null
  try {
    return await getGame(igdbId)
  } catch (e) {
    console.error('IGDB fetch failed:', e)
    return null
  }
}

export default async function GameDetailPage({ params }) {
  const { id } = await params
  const game = await getGameById(id)
  if (!game) notFound()

  const igdb = await fetchIgdb(game.igdbId)
  const cover = igdbImageUrl(igdb?.cover?.url, 'cover_big')
  const summary = igdb?.summary
  const igdbGenres = (igdb?.genres ?? []).map((g) => g.name)
  const igdbPlatforms = (igdb?.platforms ?? []).map((p) => p.name || p.abbreviation).filter(Boolean)
  const releaseDate = igdb?.first_release_date
    ? new Date(igdb.first_release_date * 1000).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : null
  const igdbUrl = igdb?.url ?? null
  const companies = igdb?.involved_companies ?? []
  const developers = companies.filter((c) => c.developer).map((c) => c.company?.name).filter(Boolean)
  const publishers = companies.filter((c) => c.publisher).map((c) => c.company?.name).filter(Boolean)

  return (
    <div className="flex min-h-screen bg-[#080a0f]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/games" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-200 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to games
          </Link>

          <div className="grid grid-cols-[200px_1fr] gap-8 mb-8">
            <div>
              {cover ? (
                <img src={cover} alt={game.title} className="w-full rounded-xl border border-white/8 shadow-2xl" />
              ) : (
                <div className="aspect-[3/4] rounded-xl bg-[#0f1117] border border-white/8 flex items-center justify-center text-zinc-700 text-xs text-center px-3">
                  {game.igdbId ? 'No cover available' : 'Not linked to IGDB'}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-zinc-600 mb-1 tracking-widest uppercase">{game.id}</p>
                <h1 className="font-display font-bold text-4xl text-zinc-100 mb-2 leading-tight">
                  {game.title}
                  {game.platinum && <span className="ml-3 text-2xl align-middle">🏆</span>}
                </h1>
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/40 text-xs">
                    {game.platform}
                  </span>
                  <StatusBadge status={game.accountStatus} />
                  {game.date && (
                    <span className="inline-flex items-center gap-1 text-zinc-500 text-xs">
                      <Calendar className="w-3 h-3" /> {formatGameDate(game.date)}
                    </span>
                  )}
                  {game.platinum && (
                    <span className="inline-flex items-center gap-1 text-amber-400 text-xs">
                      <Trophy className="w-3 h-3" /> Platinum
                    </span>
                  )}
                </div>
              </div>

              {game.completion != null && (
                <div className="max-w-sm">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1.5">Completion</p>
                  <CompletionBar value={game.completion} />
                </div>
              )}

              {game.genres.length > 0 && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1.5">Your genres</p>
                  <div className="flex flex-wrap gap-1.5">
                    {game.genres.map((g) => (
                      <span key={g} className="px-2 py-0.5 rounded-md text-xs bg-violet-900/30 text-violet-300 border border-violet-700/30">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {game.notes && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1.5">Notes</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-line">{game.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* IGDB Section */}
          {igdb ? (
            <div className="bg-[#0f1117] border border-white/6 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-zinc-100">From IGDB</h2>
                {igdbUrl && (
                  <a href={igdbUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    View on IGDB <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {summary && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-2">Summary</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{summary}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {releaseDate && (
                  <div>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1.5">Release date</p>
                    <p className="text-sm text-zinc-200">{releaseDate}</p>
                  </div>
                )}
                {developers.length > 0 && (
                  <div>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1.5">Developer</p>
                    <p className="text-sm text-zinc-200">{developers.join(', ')}</p>
                  </div>
                )}
                {publishers.length > 0 && (
                  <div>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1.5">Publisher</p>
                    <p className="text-sm text-zinc-200">{publishers.join(', ')}</p>
                  </div>
                )}
              </div>

              {igdbGenres.length > 0 && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1.5">Genres</p>
                  <div className="flex flex-wrap gap-1.5">
                    {igdbGenres.map((g) => (
                      <span key={g} className="px-2 py-0.5 rounded-md text-xs bg-zinc-800 text-zinc-300 border border-zinc-700/40">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {igdbPlatforms.length > 0 && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1.5">Available on</p>
                  <div className="flex flex-wrap gap-1.5">
                    {igdbPlatforms.map((p) => (
                      <span key={p} className="px-2 py-0.5 rounded-md text-xs bg-zinc-800 text-zinc-400 border border-zinc-700/30">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : game.igdbId ? (
            <div className="bg-[#0f1117] border border-white/6 rounded-xl p-6 text-sm text-zinc-500">
              Linked to IGDB #{game.igdbId} but couldn't load details. Check API credentials.
            </div>
          ) : (
            <div className="bg-[#0f1117] border border-white/6 rounded-xl p-6 text-sm text-zinc-500">
              This game isn't linked to IGDB yet. Edit it from the games list to search and link.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
