import { NextResponse } from 'next/server'
import { getGames, addGame } from '@/lib/sheets'

export async function GET() {
  try {
    const games = await getGames()
    return NextResponse.json(games)
  } catch (err) {
    console.error('GET /api/games:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const game = await addGame(body)
    return NextResponse.json(game, { status: 201 })
  } catch (err) {
    console.error('POST /api/games:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
