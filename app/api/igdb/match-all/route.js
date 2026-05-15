import { NextResponse } from 'next/server'
import { getGames, updateGame } from '@/lib/sheets'
import { findBestMatch } from '@/lib/igdb'

// Best-effort title matching for games without an igdbId.
// Rate-limited to ~3 req/s to stay under IGDB's 4 req/s ceiling.
export async function POST() {
  try {
    const games = await getGames()
    const pending = games.filter((g) => !g.igdbId && g.title)

    const matched = []
    const skipped = []
    const failed = []

    for (const g of pending) {
      try {
        const igdbId = await findBestMatch(g.title)
        if (igdbId) {
          await updateGame(g.id, { ...g, igdbId: String(igdbId) })
          matched.push({ id: g.id, title: g.title, igdbId })
        } else {
          skipped.push({ id: g.id, title: g.title, reason: 'no results' })
        }
      } catch (e) {
        failed.push({ id: g.id, title: g.title, error: e.message })
      }
      await new Promise((r) => setTimeout(r, 350))
    }

    return NextResponse.json({
      total: pending.length,
      matched: matched.length,
      skipped: skipped.length,
      failed: failed.length,
      details: { matched, skipped, failed },
    })
  } catch (err) {
    console.error('POST /api/igdb/match-all:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
