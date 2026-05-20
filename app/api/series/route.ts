// ============================================================
// app/api/series/route.ts  ← substitui o arquivo atual
// ============================================================

import { NextResponse } from 'next/server'
import { getSeries, createSeries } from '@/lib/supabase'

export async function GET() {
  try {
    const series = await getSeries()
    return NextResponse.json(series)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json()
    const s = await createSeries(name)
    return NextResponse.json(s, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
