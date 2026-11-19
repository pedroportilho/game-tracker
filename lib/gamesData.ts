// lib/gamesData.ts
// Acesso ao banco dos jogos (servidor). Toda consulta filtra pelo user_id.

import { supabaseAdmin } from "./supabaseAdmin";

export type Game = {
  id: string;
  user_id: string;
  title: string;
  platform: string;
  date: string | null;
  platinum: boolean;
  completion: number | null;
  account_status: string;
  game_status: string;
  genres: string[];
  notes: string | null;
  igdb_id: number | null;
  themes: string[];
  cover: string | null;
};

/** O que o formulário envia para criar/editar (o banco gera id e user_id). */
export type GameInput = Omit<Game, "id" | "user_id">;

// Campos que o cliente pode gravar. Qualquer outro (id, user_id, datas de
// controle…) é descartado — sem isso, um PUT com user_id no corpo moveria o
// jogo para outra conta.
const GAME_INPUT_FIELDS = [
  "title", "platform", "date", "platinum", "completion", "account_status",
  "game_status", "genres", "notes", "igdb_id", "themes", "cover",
] as const satisfies readonly (keyof GameInput)[];

/** Só os campos permitidos de um corpo de requisição. */
export function pickGameInput(body: unknown): Partial<GameInput> {
  const src = (body ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of GAME_INPUT_FIELDS) if (key in src) out[key] = src[key];
  return out as Partial<GameInput>;
}

export async function getGames(userId: string): Promise<Game[]> {
  const { data, error } = await supabaseAdmin
    .from("games")
    .select("*")
    .eq("user_id", userId)
    .order("title");

  if (error) throw new Error(error.message);
  return data as Game[];
}

export async function getBacklog(userId: string): Promise<Game[]> {
  const backlog = "Lost";
  const { data, error } = await supabaseAdmin
    .from("games")
    .select("*")
    .eq("user_id", userId)
    .eq("account_status", backlog)
    .order("title");

  if (error) throw new Error(error.message);
  return data as Game[];
}

export async function getGameById(
  id: string,
  userId: string,
): Promise<Game | null> {
  const { data, error } = await supabaseAdmin
    .from("games")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data as Game;
}

export async function createGame(
  game: GameInput,
  userId: string,
): Promise<Game> {
  const { data, error } = await supabaseAdmin
    .from("games")
    .insert({ ...game, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Game;
}

export async function updateGame(
  id: string,
  game: Partial<Game>,
  userId: string,
): Promise<Game> {
  const { data, error } = await supabaseAdmin
    .from("games")
    .update(game)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Game;
}

export async function deleteGame(id: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("games")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
