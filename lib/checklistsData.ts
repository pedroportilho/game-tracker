// lib/checklistsData.ts
// Acesso ao banco dos checklists (servidor). A estrutura é pública e igual para
// todos; o progresso é filtrado SEMPRE pelo user_id, como no resto do projeto.

import { supabaseAdmin } from "./supabaseAdmin";
import type {
  ChecklistGame,
  ChecklistSection,
  Progress,
} from "./checklists";

export type ChecklistFranchise = {
  id: string;
  name: string;
  sort: number;
  games: ChecklistGame[];
};

// O PostgREST devolve no máximo ~1000 linhas por requisição; progresso pode
// passar disso quando houver muitas franquias, então lemos em páginas.
async function fetchAllProgress(userId: string, itemPrefix?: string) {
  const rows: { item_id: string; value: number }[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let q = supabaseAdmin
      .from("checklist_progress")
      .select("item_id, value")
      .eq("user_id", userId)
      .order("item_id")
      .range(from, from + pageSize - 1);
    if (itemPrefix) q = q.like("item_id", `${itemPrefix}%`);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

function sortGame(game: any): ChecklistGame {
  const sections: ChecklistSection[] = (game.checklist_sections ?? [])
    .map((s: any) => ({
      id: s.id,
      game_id: s.game_id,
      name: s.name,
      layout: s.layout,
      weight: Number(s.weight),
      sort: s.sort,
      items: (s.checklist_items ?? []).sort((a: any, b: any) => a.sort - b.sort),
    }))
    .sort((a: ChecklistSection, b: ChecklistSection) => a.sort - b.sort);

  return {
    id: game.id,
    franchise_id: game.franchise_id,
    name: game.name,
    logo: game.logo,
    sort: game.sort,
    sections,
  };
}

/** Todas as franquias com jogos, seções e itens (estrutura pública). */
export async function getChecklistCatalog(): Promise<ChecklistFranchise[]> {
  const { data, error } = await supabaseAdmin
    .from("checklist_franchises")
    .select(
      "*, checklist_games(*, checklist_sections(*, checklist_items(*)))",
    )
    .order("sort");

  if (error) throw new Error(error.message);

  return (data as any[]).map((f) => ({
    id: f.id,
    name: f.name,
    sort: f.sort,
    games: (f.checklist_games ?? [])
      .map(sortGame)
      .sort((a: ChecklistGame, b: ChecklistGame) => a.sort - b.sort),
  }));
}

/** Um jogo com todas as suas seções e itens, ou null se não existir. */
export async function getChecklistGame(
  gameId: string,
): Promise<ChecklistGame | null> {
  const { data, error } = await supabaseAdmin
    .from("checklist_games")
    .select("*, checklist_sections(*, checklist_items(*))")
    .eq("id", gameId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? sortGame(data) : null;
}

/** Progresso do usuário como mapa item_id → valor. Sem linha = 0. */
export async function getChecklistProgress(
  userId: string,
  gameId?: string,
): Promise<Progress> {
  // Os ids dos itens começam com o id do jogo ('zelda-alttp.inventory.bow')
  const rows = await fetchAllProgress(userId, gameId ? `${gameId}.` : undefined);
  const progress: Progress = {};
  for (const r of rows) progress[r.item_id] = r.value;
  return progress;
}

/**
 * Grava o valor de um item. 0 apaga a linha (progresso é esparso).
 * Retorna o valor realmente gravado.
 */
export async function setChecklistProgress(
  userId: string,
  itemId: string,
  value: number,
): Promise<number> {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Invalid value");
  }

  const { data: item, error: itemError } = await supabaseAdmin
    .from("checklist_items")
    .select("max_value")
    .eq("id", itemId)
    .maybeSingle();

  if (itemError) throw new Error(itemError.message);
  if (!item) throw new Error("Item not found");
  if (value > item.max_value) throw new Error("Value exceeds max");

  if (value === 0) {
    const { error } = await supabaseAdmin
      .from("checklist_progress")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", itemId);
    if (error) throw new Error(error.message);
    return 0;
  }

  const { error } = await supabaseAdmin.from("checklist_progress").upsert(
    {
      user_id: userId,
      item_id: itemId,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,item_id" },
  );
  if (error) throw new Error(error.message);
  return value;
}
