import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/Sidebar'
import { StatusBadge, CompletionBar } from '@/components/ui'
import { getGameById } from '@/lib/supabase'
import { getGame, igdbImageUrl } from '@/lib/igdb'
import { getUserFromCookies } from '@/lib/auth'
import { formatGameDate } from '@/lib/constants'
import { ArrowLeft, ExternalLink, Calendar, Trophy } from 'lucide-react'
import { GameEditButton } from '@/components/GameEditButton'

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
  const user = await getUserFromCookies()
  if (!user) {
    return (
      <div className="flex min-h-screen bg-[#080a0f]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-xl text-center text-zinc-200">
            <h1 className="text-3xl font-bold mb-4">Login required</h1>
            <p className="text-zinc-400 mb-6">Sign in from the Games page to view game details.</p>
            <Link href="/games" className="inline-flex items-center justify-center rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition">Go to Games</Link>
          </div>
        </div>
      </div>
    )
  }

  const { id } = await params
  const game = await getGameById(id, user.id)
  if (!game) notFound()

  const igdb = await fetchIgdb(game.igdb_id)
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

      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader title={game.title} />

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">

            <div className="flex items-center justify-between mb-6">
              <Link
                href="/games"
                className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to games
              </Link>
              <GameEditButton game={game} />
            </div>

            <div className="flex flex-col md:grid md:grid-cols-[200px_1fr] gap-5 md:gap-8 mb-6 md:mb-8">
              <div className="flex justify-center md:block">
                {cover ? (
                  <img
                    src={cover}
                    alt={game.title}
                    className="w-36 md:w-full rounded-xl border border-white/8 shadow-2xl"
                  />
                ) : (
                  <div className="w-36 md:w-full aspect-[3/4] rounded-xl bg-[#0f1117] border border-white/8 flex items-center justify-center text-zinc-700 text-xs text-center px-3">
                    {game.igdb_id ? 'No cover available' : 'Not linked to IGDB'}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs text-zinc-600 mb-1 tracking-widest uppercase">{game.id}</p>
                  <h1 className="font-display font-bold text-2xl md:text-4xl text-zinc-100 mb-2 leading-tight">
                    {game.title}
                    {game.platinum && <span className="ml-3 text-xl md:text-2xl align-middle">🏆</span>}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/40 text-xs">
                      {game.platform}
                    </span>
                    <StatusBadge status={game.account_status} />
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

                {summary && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1.5">IGDB summary</p>
                    <p className="text-sm leading-relaxed text-zinc-300">{summary}</p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {releaseDate && (
                    <div className="rounded-xl bg-[#0f1117] border border-white/6 p-4">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Released</p>
                      <p className="text-sm text-zinc-100">{releaseDate}</p>
                    </div>
                  )}

                  {igdbPlatforms.length > 0 && (
                    <div className="rounded-xl bg-[#0f1117] border border-white/6 p-4">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">IGDB platforms</p>
                      <p className="text-sm text-zinc-100">{igdbPlatforms.join(', ')}</p>
                    </div>
                  )}
                </div>

                {igdbUrl && (
                  <Link href={igdbUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition">
                    <ExternalLink className="w-4 h-4" /> View on IGDB
                  </Link>
                )}

                {developers.length > 0 && (
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Developers</p>
                    <p className="text-sm text-zinc-100">{developers.join(', ')}</p>
                  </div>
                )}

                {publishers.length > 0 && (
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Publishers</p>
                    <p className="text-sm text-zinc-100">{publishers.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
