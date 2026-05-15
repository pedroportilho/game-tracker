import { NextResponse } from 'next/server'
import { getGame, igdbImageUrl } from '@/lib/igdb'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const game = await getGame(id)
    if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const companies = game.involved_companies ?? []
    const trimmed = {
      id: game.id,
      name: game.name,
      summary: game.summary ?? null,
      storyline: game.storyline ?? null,
      url: game.url ?? null,
      releaseDate: game.first_release_date
        ? new Date(game.first_release_date * 1000).toISOString().slice(0, 10)
        : null,
      cover: igdbImageUrl(game.cover?.url, 'cover_big'),
      genres: (game.genres ?? []).map((g) => g.name),
      platforms: (game.platforms ?? []).map((p) => p.name || p.abbreviation).filter(Boolean),
      developers: companies.filter((c) => c.developer).map((c) => c.company?.name).filter(Boolean),
      publishers: companies.filter((c) => c.publisher).map((c) => c.company?.name).filter(Boolean),
    }
    return NextResponse.json(trimmed)
  } catch (err) {
    console.error('GET /api/igdb/games/[id]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
