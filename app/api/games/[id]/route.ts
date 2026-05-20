// ============================================================
// app/api/games/[id]/route.ts  ← substitui o arquivo atual
// ============================================================

import { NextResponse } from 'next/server'
import { updateGame, deleteGame } from '@/lib/supabase'


export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const body = await req.json()
    const game = await updateGame(id, body)
    return NextResponse.json(game)
  } catch (e: any) {
    console.error('PUT /api/games error:', e.message) // ← adicione isso
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await deleteGame(params.id)
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
