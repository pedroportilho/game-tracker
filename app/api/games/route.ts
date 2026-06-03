import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { getGames, createGame } from '@/lib/supabase'

export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const games = await getGames(user.id)
    return NextResponse.json(games)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const game = await createGame(body, user.id)
    return NextResponse.json(game, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/games error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
