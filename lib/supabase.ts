import { supabaseAdmin } from './supabaseAdmin'

export type Game = {
  id: string
  user_id: string
  title: string
  platform: string
  date: string | null
  platinum: boolean
  completion: number | null
  account_status: string
  game_status: string
  genres: string[]
  notes: string | null
  igdb_id: number | null
  themes: string[]
  cover: string | null
}

export type SeriesEntry = {
  id: number
  series_id: number
  title: string
  completed: boolean
  position: number
}

export type Series = {
  id: number
  user_id: string
  name: string
  entries: SeriesEntry[]
}

async function ensureSeriesBelongsToUser(seriesId: number, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('series')
    .select('id')
    .eq('id', seriesId)
    .eq('user_id', userId)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Series not found or unauthorized')
}

async function ensureEntryBelongsToUser(entryId: number, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('series_entries')
    .select('series_id')
    .eq('id', entryId)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Entry not found')

  await ensureSeriesBelongsToUser(data.series_id, userId)
}

export async function getGames(userId: string): Promise<Game[]> {
  const { data, error } = await supabaseAdmin
    .from('games')
    .select('*')
    .eq('user_id', userId)
    .order('title')

  if (error) throw new Error(error.message)
  return data as Game[]
}

export async function getBacklog(userId: string): Promise<Game[]> {
  const backlog = 'Lost'
  const { data, error } = await supabaseAdmin
    .from('games')
    .select('*')
    .eq('user_id', userId)
    .eq('account_status', backlog)
    .order('title')

  if (error) throw new Error(error.message)
  return data as Game[]
}

export async function getGameById(id: string, userId: string): Promise<Game | null> {
  const { data, error } = await supabaseAdmin
    .from('games')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data as Game
}

export async function createGame(game: Omit<Game, 'id' | 'user_id'>, userId: string): Promise<Game> {
  const { data, error } = await supabaseAdmin
    .from('games')
    .insert({ ...game, user_id: userId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Game
}

export async function updateGame(id: string, game: Partial<Game>, userId: string): Promise<Game> {
  const { data, error } = await supabaseAdmin
    .from('games')
    .update(game)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Game
}

export async function deleteGame(id: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('games')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function getSeries(userId: string): Promise<Series[]> {
  const { data, error } = await supabaseAdmin
    .from('series')
    .select('*, series_entries(*)')
    .eq('user_id', userId)
    .order('name')

  if (error) throw new Error(error.message)

  return (data as any[]).map((s) => ({
    id:      s.id,
    user_id: s.user_id,
    name:    s.name,
    entries: (s.series_entries ?? []).sort((a: any, b: any) => a.position - b.position),
  }))
}

export async function createSeries(name: string, userId: string): Promise<Series> {
  const { data, error } = await supabaseAdmin
    .from('series')
    .insert({ name, user_id: userId })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return {
    id:      data.id,
    user_id: data.user_id,
    name:    data.name,
    entries: [],
  }
}

export async function addSeriesEntry(seriesId: number, title: string, userId: string): Promise<SeriesEntry> {
  await ensureSeriesBelongsToUser(seriesId, userId)

  const { data, error } = await supabaseAdmin
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

export async function toggleSeriesEntry(id: number, completed: boolean, userId: string): Promise<void> {
  await ensureEntryBelongsToUser(id, userId)

  const { error } = await supabaseAdmin
    .from('series_entries')
    .update({ completed })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function updateEntriesOrder(entries: SeriesEntry[], userId: string): Promise<void> {
  if (entries.length === 0) return

  const ids = entries.map((entry) => entry.id)
  const { data, error } = await supabaseAdmin
    .from('series_entries')
    .select('series_id')
    .in('id', ids)

  if (error) throw new Error(error.message)
  if (!data || data.length !== ids.length) throw new Error('Invalid entries')

  const seriesIds = Array.from(new Set(data.map((entry: any) => entry.series_id)))
  if (seriesIds.length !== 1) throw new Error('Entries must belong to the same series')

  await ensureSeriesBelongsToUser(seriesIds[0], userId)

  const updates = entries.map((entry, index) => ({
    id:       entry.id,
    position: index + 1,
  }))

  const { error: upsertError } = await supabaseAdmin
    .from('series_entries')
    .upsert(updates)

  if (upsertError) throw new Error(upsertError.message)
}
