// lib/seriesData.ts
// Acesso ao banco das séries (servidor). Toda consulta confere o dono da série.

import { supabaseAdmin } from "./supabaseAdmin";

export type SeriesEntry = {
  id: number;
  series_id: number;
  title: string;
  completed: boolean;
  position: number;
};

export type Series = {
  id: number;
  user_id: string;
  name: string;
  entries: SeriesEntry[];
};

async function ensureSeriesBelongsToUser(seriesId: number, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("series")
    .select("id")
    .eq("id", seriesId)
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Series not found or unauthorized");
}

async function ensureEntryBelongsToUser(entryId: number, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("series_entries")
    .select("series_id")
    .eq("id", entryId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Entry not found");

  await ensureSeriesBelongsToUser(data.series_id, userId);
}

export async function getSeries(userId: string): Promise<Series[]> {
  const { data, error } = await supabaseAdmin
    .from("series")
    .select("*, series_entries(*)")
    .eq("user_id", userId)
    .order("name");

  if (error) throw new Error(error.message);

  type SeriesRow = Omit<Series, "entries"> & {
    series_entries: SeriesEntry[] | null;
  };
  return (data as SeriesRow[]).map((s) => ({
    id: s.id,
    user_id: s.user_id,
    name: s.name,
    entries: (s.series_entries ?? []).sort((a, b) => a.position - b.position),
  }));
}

export async function createSeries(
  name: string,
  userId: string,
): Promise<Series> {
  const { data, error } = await supabaseAdmin
    .from("series")
    .insert({ name, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    entries: [],
  };
}

export async function addSeriesEntry(
  seriesId: number,
  title: string,
  userId: string,
): Promise<SeriesEntry> {
  await ensureSeriesBelongsToUser(seriesId, userId);

  const { data, error } = await supabaseAdmin
    .from("series_entries")
    .insert({ series_id: seriesId, title, completed: false })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    title: data.title,
    completed: data.completed,
    series_id: data.series_id,
    position: data.position,
  };
}

export async function toggleSeriesEntry(
  id: number,
  completed: boolean,
  userId: string,
): Promise<void> {
  await ensureEntryBelongsToUser(id, userId);

  const { error } = await supabaseAdmin
    .from("series_entries")
    .update({ completed })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function updateEntriesOrder(
  entries: Array<{ id: number }>,
  userId: string,
): Promise<void> {
  if (entries.length === 0) return;

  const ids = entries.map((entry) => entry.id);

  // Prevent duplicate IDs
  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate entries");
  }

  // Check that all entries exist
  const { data, error } = await supabaseAdmin
    .from("series_entries")
    .select("id, series_id")
    .in("id", ids);

  if (error) throw new Error(error.message);

  if (!data || data.length !== ids.length) {
    throw new Error("Invalid entries");
  }

  // Ensure all entries belong to the same series
  const seriesIds = Array.from(new Set(data.map((entry) => entry.series_id)));

  if (seriesIds.length !== 1) {
    throw new Error("Entries must belong to the same series");
  }

  // Verify ownership
  await ensureSeriesBelongsToUser(seriesIds[0], userId);

  // Update positions without inserting new records
  const results = await Promise.all(
    entries.map((entry, index) =>
      supabaseAdmin
        .from("series_entries")
        .update({ position: index + 1 })
        .eq("id", entry.id)
        .eq("series_id", seriesIds[0]),
    ),
  );

  const failedUpdate = results.find((result) => result.error);

  if (failedUpdate?.error) {
    throw new Error(failedUpdate.error.message);
  }
}
