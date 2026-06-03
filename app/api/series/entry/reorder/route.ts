import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { updateEntriesOrder } from '@/lib/supabase'

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { entries } = await req.json()
    await updateEntriesOrder(entries, user.id)
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
