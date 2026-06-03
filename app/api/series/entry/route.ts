import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { addSeriesEntry, toggleSeriesEntry } from '@/lib/supabase'

export async function PATCH(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, completed } = await req.json()
    await toggleSeriesEntry(Number(id), completed, user.id)
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { seriesId, title } = await req.json()
    const entry = await addSeriesEntry(Number(seriesId), title, user.id)
    return NextResponse.json(entry, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
