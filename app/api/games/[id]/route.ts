import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { updateGame, deleteGame } from '@/lib/supabase'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { id: _, created_at, updated_at, ...data } = body
    const game = await updateGame(id, data, user.id)
    return NextResponse.json(game)
  } catch (e: any) {
    console.error('PUT /api/games error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await deleteGame(id, user.id)
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
