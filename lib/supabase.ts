// ============================================================
// lib/supabase.ts  ← substitui lib/sheets.ts inteiro
// ============================================================

import { createClient } from '@supabase/supabase-js'

// ─── Client (singleton) ──────────────────────────────────────
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnon)

// ─── Tipos ───────────────────────────────────────────────────
export type Game = {
  id: string
  title: string
  platform: string
  date: string | null
  platinum: boolean
  completion: number | null
  account_status: string
  genres: string[]
  notes: string | null
  igdb_id: number | null
}

export type Series = {
  id: number
  name: string
  entries: SeriesEntry[]
}

export type SeriesEntry = {
  id: number
  series_id: number
  title: string
  completed: boolean
  position: number
}

// ─── Games ───────────────────────────────────────────────────
export async function getGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('title')
  if (error) throw new Error(error.message)
  return data as Game[]
}

export async function getBacklog(): Promise<Game[]> {
  const backlog = 'Lost Account'
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('account_status', backlog)
    .order('title')
  if (error) throw new Error(error.message)
  return data as Game[]
}

export async function getGameById(id: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Game
}

export async function createGame(game: Omit<Game, 'id'> & { id?: string }): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .insert(game)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Game
}

export async function updateGame(id: string, game: Partial<Game>): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .update(game)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Game
}

export async function deleteGame(id: string): Promise<void> {
  const { error } = await supabase.from('games').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Series ──────────────────────────────────────────────────
export async function getSeries(): Promise<Series[]> {
  const { data, error } = await supabase
    .from('series')
    .select('*, series_entries(*)')
    .order('name')

  if (error) throw new Error(error.message)

  return (data as any[]).map((s) => ({
    id:      s.id,
    name:    s.name,
    entries: (s.series_entries ?? []).sort((a: any, b: any) => a.position - b.position),
  }))
}

// Adiciona uma nova série
export async function createSeries(name: string): Promise<Series> {
  const { data, error } = await supabase
    .from('series')
    .insert({ name })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return {
    id:      data.id,
    name:    data.name,
    entries: [],
  }
}

export async function addSeriesEntry(seriesId: number, title: string): Promise<SeriesEntry> {
  const { data, error } = await supabase
    .from('series_entries')
    .insert({ series_id: seriesId, title, completed: false })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return {
    id:        data.id,
    title:     data.title,
    completed: data.completed,
    series_id: data.series_id,
    position: data.position,
  }
}

export async function toggleSeriesEntry(id: number, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from('series_entries')
    .update({ completed })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateEntriesOrder(entries: SeriesEntry[]): Promise<void> {
  const updates = entries.map((entry, index) => ({
    id:       entry.id,
    position: index + 1,
  }))

  const { error } = await supabase
    .from('series_entries')
    .upsert(updates)

  if (error) throw new Error(error.message)
}