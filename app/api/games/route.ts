// ============================================================
// app/api/games/route.ts  ← substitui o arquivo atual
// ============================================================

import { NextResponse } from 'next/server'
import { getGames, createGame } from '@/lib/supabase'

export async function GET() {
  try {
    const games = await getGames()
    return NextResponse.json(games)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const game = await createGame(body)
    return NextResponse.json(game)
  } catch (e: any) {
    console.error('POST /api/games error:', e.message) // ← adicione isso
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
