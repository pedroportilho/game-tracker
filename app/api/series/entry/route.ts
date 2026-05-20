// ============================================================
// app/api/series/entry/route.ts  ← substitui o arquivo atual
// ============================================================

import { NextResponse } from 'next/server'
import { addSeriesEntry, toggleSeriesEntry } from '@/lib/supabase'

// PATCH → toggle completed
export async function PATCH(req: Request) {
  try {
    const { id, completed } = await req.json()
    await toggleSeriesEntry(Number(id), completed)
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST → add entry
export async function POST(req: Request) {
  try {
    const { seriesId, title } = await req.json()
    const entry = await addSeriesEntry(Number(seriesId), title)
    return NextResponse.json(entry, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
