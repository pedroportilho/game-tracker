import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { getSeries, createSeries } from '@/lib/supabase'

export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const series = await getSeries(user.id)
    return NextResponse.json(series)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name } = await req.json()
    const s = await createSeries(name, user.id)
    return NextResponse.json(s, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
