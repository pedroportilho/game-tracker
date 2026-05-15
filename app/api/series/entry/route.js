import { updateSeriesEntry, addSeriesEntry } from '@/lib/sheets'
import { NextResponse } from 'next/server'

// PATCH /api/series/entry — toggle completed state
export async function PATCH(req) {
  const { rowIndex, colIndex, completed } = await req.json()
  await updateSeriesEntry(rowIndex, colIndex, completed)
  return NextResponse.json({ ok: true })
}

// POST /api/series/entry
// body: { action: 'add', colIndex, title }
export async function POST(req) {
  const { action, colIndex, title } = await req.json()
  if (action === 'add') {
    await addSeriesEntry(colIndex, title)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
