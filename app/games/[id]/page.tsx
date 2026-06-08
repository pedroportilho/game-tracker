import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/Sidebar'
import { StatusBadge, CompletionBar } from '@/components/ui'
import { getGameById } from '@/lib/supabase'
import { getGame, igdbImageUrl } from '@/lib/igdb'
import { getUserFromCookies } from '@/lib/auth'
import { formatGameDate } from '@/lib/constants'
import { ArrowLeft, ExternalLink, Calendar, Trophy, Monitor, Users, Pencil, Tag, FileText } from 'lucide-react'
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

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
      {children}
    </p>
  )
}

function InfoCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl bg-[#0f1117] border border-white/[0.06] p-4 ${className}`}>
      {children}
    </div>
  )
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
  const igdbPlatforms = (igdb?.platforms ?? []).map((p) => p.name || p.abbreviation).filter(Boolean)
  const igdbThemes = (igdb?.themes ?? []).map((t) => t.name).filter(Boolean)
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
          <div className="w-full">

            {/* Top nav */}
            <div className="flex items-center justify-between mb-8">
              <Link
                href="/games"
                className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to games
              </Link>
              <GameEditButton game={game} />
            </div>

            {/* Hero: cover + title block */}
            <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-6 md:gap-10 mb-10">

              {/* Cover */}
              <div className="flex justify-center md:block">
                {cover ? (
                  <img
                    src={cover}
                    alt={game.title}
                    className="w-40 md:w-full rounded-2xl border border-white/8 shadow-2xl"
                  />
                ) : (
                  <div className="w-40 md:w-full aspect-[3/4] rounded-2xl bg-[#0f1117] border border-white/8 flex items-center justify-center text-zinc-700 text-xs text-center px-3">
                    {game.igdb_id ? 'No cover available' : 'Not linked to IGDB'}
                  </div>
                )}
              </div>

              {/* Title + status + completion */}
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-xs text-zinc-600 mb-1 tracking-widest uppercase">{game.id}</p>
                  <h1 className="font-display font-bold text-2xl md:text-4xl text-zinc-100 mb-2 leading-tight">
                    {game.title}
                    {game.platinum && <span className="ml-3 text-2xl md:text-3xl align-middle">🏆</span>}
                  </h1>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/40 text-xs font-medium">
                      {game.platform}
                    </span>
                    <StatusBadge status={game.account_status} />
                    {game.platinum && (
                      <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                        <Trophy className="w-3.5 h-3.5" /> Platinum
                      </span>
                    )}
                    {game.date && (
                      <span className="inline-flex items-center gap-1.5 text-zinc-500 text-xs">
                        <Calendar className="w-3.5 h-3.5" /> {formatGameDate(game.date)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4 max-w-2xl md:flex-row">
                  {/* Completion */}
                  {game.completion != null && (
                    <div className='w-full md:w-[80%]'>
                      <SectionLabel>Completion</SectionLabel>
                      <CompletionBar value={game.completion} />
                    </div>
                  )}

                  {/* IGDB link */}
                  {igdbUrl && (
                    <div className='flex w-[50%] justify-start md:justify-end'>
                      <Link
                        href={igdbUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-1 text-sm font-semibold text-white hover:bg-violet-500 transition"
                      >
                        <ExternalLink className="w-4 h-4" /> View on IGDB
                      </Link>
                    </div>
                )}
                </div>

                {/* User Notes */}
                {game.notes && (
                  <div className="max-w-2xl">
                    <InfoCard>
                      <SectionLabel>Notes</SectionLabel>
                      <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{game.notes}</p>
                    </InfoCard>
                  </div>
                )}

                {/* Genres + Themes */}
                <div className="flex flex-col md:flex-row gap-3">
                  {game.genres?.length > 0 && (
                    <div className='w-full md:w-[50%]'>
                      <SectionLabel>Genres</SectionLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {game.genres.map((g) => (
                          <span key={g} className="px-2.5 py-1 rounded-lg text-xs bg-violet-900/30 text-violet-300 border border-violet-700/30 font-medium">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {igdbThemes.length > 0 && (
                    <div>
                      <SectionLabel>Themes</SectionLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {igdbThemes.map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-sky-900/25 text-sky-300 border border-sky-700/25 font-medium">
                            <Tag className="w-3 h-3" />{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.06] mb-8" />
            
            {/* Summary */}
              {summary && (
                <div className="mb-8 max-w-5xl">
                  <InfoCard>
                    <SectionLabel>Summary</SectionLabel>
                    <p className="text-sm leading-relaxed text-zinc-400">{summary}</p>
                  </InfoCard>
                </div>
            )}

            <div className="flex flex-col md:flex-row max-w-5xl gap-4">
            {/* Info grid */}
              <div className="w-full md:w-[35%]">
                  <InfoCard>
                    {releaseDate && (
                      <div>
                        <SectionLabel>Released</SectionLabel>
                        <p className="text-sm text-zinc-100 font-medium mb-2">{releaseDate}</p>
                        <div className="border-t border-white/[0.06] mb-2" />
                      </div>
                    )}

                    {developers.length > 0 && (
                      <div>
                        <SectionLabel>Developer{developers.length > 1 ? 's' : ''}</SectionLabel>
                        <div className="flex flex-col gap-1 mb-2">
                          {developers.map((d) => (
                            <p key={d} className="text-sm text-zinc-100">{d}</p>
                          ))}
                        </div>
                        <div className="border-t border-white/[0.06] mb-2" />
                      </div>
                    )}

                    {publishers.length > 0 && (
                      <div>
                        <SectionLabel>Publisher{publishers.length > 1 ? 's' : ''}</SectionLabel>
                        <div className="flex flex-col gap-1 mb-2">
                          {publishers.map((p) => (
                            <p key={p} className="text-sm text-zinc-100">{p}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </InfoCard>
              </div>

              {/* Platforms */}
              {igdbPlatforms.length > 0 && (
                <div className="w-full md:w-[60%]">
                  <InfoCard className="h-full">
                    <SectionLabel>Available on</SectionLabel>
                    <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                      {igdbPlatforms.map((platform) => (
                        <li key={platform} className="flex items-center gap-2 text-sm text-zinc-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                          {platform}
                        </li>
                      ))}
                    </ul>
                  </InfoCard>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
