import { NextResponse } from 'next/server'
import { searchGames, getGame, igdbImageUrl } from '@/lib/igdb'

function trim(g) {
  return {
    id: g.id,
    name: g.name,
    cover: igdbImageUrl(g.cover?.url, 'cover_small'),
    year: g.first_release_date ? new Date(g.first_release_date * 1000).getUTCFullYear() : null,
    platforms: (g.platforms ?? []).map((p) => p.abbreviation || p.name).filter(Boolean),
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') ?? '').trim()

    // If the query is purely digits, treat it as an IGDB ID lookup
    if (/^\d+$/.test(q)) {
      const game = await getGame(q)
      return NextResponse.json(game ? [trim(game)] : [])
    }

    const results = await searchGames(q, 10)
    return NextResponse.json(results.map(trim))
  } catch (err) {
    console.error('GET /api/igdb/search:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
