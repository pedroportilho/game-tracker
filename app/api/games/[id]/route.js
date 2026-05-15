import { NextResponse } from 'next/server'
import { updateGame, deleteGame } from '@/lib/sheets'

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const game = await updateGame(id, body)
    return NextResponse.json(game)
  } catch (err) {
    console.error(`PUT /api/games/${params?.id}:`, err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    await deleteGame(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(`DELETE /api/games/${params?.id}:`, err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
