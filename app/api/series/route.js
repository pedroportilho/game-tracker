import { getSeries, addSeries } from '@/lib/sheets'
import { NextResponse } from 'next/server'

export async function GET() {
  const series = await getSeries()
  console.log('series:', JSON.stringify(series.map(s => ({ name: s.name, colIndex: s.colIndex, firstEntry: s.entries[0] }))))
  return NextResponse.json(series)
}

export async function POST(req) {
  const { name } = await req.json()
  const colIndex = await addSeries(name)
  return NextResponse.json({ colIndex })
}
