// lib/igdb.ts
// Cliente da API da IGDB (servidor) — autenticação pelo client_credentials
// da Twitch. Docs: https://api-docs.igdb.com/
//
// Os tipos Igdb* descrevem o que a IGDB devolve; IgdbSearchResult e
// IgdbGameDetails são as versões enxutas que nossas rotas /api/igdb mandam
// para o navegador (o GameForm importa esses tipos).

import { unstable_cache } from "next/cache";

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_BASE = "https://api.igdb.com/v4";

// ─── O que a IGDB devolve (só os campos que pedimos) ─────────────────────────
type IgdbNamed = { id?: number; name: string };
type IgdbPlatform = { id?: number; name?: string; abbreviation?: string };
type IgdbCompany = {
  company?: IgdbNamed;
  developer: boolean;
  publisher: boolean;
};

export type IgdbGame = {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  url?: string;
  /** timestamp em segundos */
  first_release_date?: number;
  cover?: { url: string };
  genres?: IgdbNamed[];
  themes?: IgdbNamed[];
  platforms?: IgdbPlatform[];
  involved_companies?: IgdbCompany[];
};

export type IgdbCoverSize = "cover_small" | "cover_big";

// ─── O que nossas rotas devolvem ─────────────────────────────────────────────
/** GET /api/igdb/search */
export type IgdbSearchResult = {
  id: number;
  name: string;
  cover: string | null;
  year: number | null;
  platforms: string[];
};

/** GET /api/igdb/games/[id] */
export type IgdbGameDetails = {
  id: number;
  name: string;
  summary: string | null;
  storyline: string | null;
  url: string | null;
  /** AAAA-MM-DD */
  releaseDate: string | null;
  cover: string | null;
  genres: string[];
  themes: string[];
  platforms: string[];
  developers: string[];
  publishers: string[];
};

// ─── Autenticação + consulta ─────────────────────────────────────────────────
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  if (!id || !secret)
    throw new Error("Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET");

  const params = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    grant_type: "client_credentials",
  });
  const res = await fetch(`${TWITCH_TOKEN_URL}?${params}`, { method: "POST" });
  if (!res.ok)
    throw new Error(`Twitch token error ${res.status}: ${await res.text()}`);
  const json: { access_token: string; expires_in: number } = await res.json();
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.value;
}

async function igdbQuery<T>(endpoint: string, body: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${IGDB_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok)
    throw new Error(
      `IGDB ${endpoint} error ${res.status}: ${await res.text()}`,
    );
  return res.json();
}

// ─── Funções públicas ────────────────────────────────────────────────────────

/** As capas vêm como "//images.igdb.com/.../t_thumb/..." — troca tamanho e protocolo. */
export function igdbImageUrl(
  url: string | undefined | null,
  size: IgdbCoverSize = "cover_big",
): string | null {
  if (!url) return null;
  return ("https:" + url).replace("t_thumb", `t_${size}`);
}

export async function searchGames(query: string, limit = 10): Promise<IgdbGame[]> {
  if (!query || query.trim().length < 2) return [];
  const safeQuery = query.replace(/"/g, '\\"');
  const body = `
    search "${safeQuery}";
    fields id, name, cover.url, first_release_date, platforms.abbreviation, platforms.name;
    limit ${limit};
  `;
  return igdbQuery<IgdbGame[]>("games", body);
}

export async function getGame(id: number | string): Promise<IgdbGame | null> {
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) return null;
  const body = `
    fields
      id, name, summary, storyline, first_release_date, url,
      cover.url,
      genres.name,
      themes.name,
      platforms.abbreviation, platforms.name,
      involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
    where id = ${numId};
  `;
  const arr = await igdbQuery<IgdbGame[]>("games", body);
  return arr[0] ?? null;
}

/**
 * Detalhes de um jogo com cache de 1 dia — para a página de um jogo, que
 * antes consultava a IGDB a cada visita. Erros não entram no cache.
 */
export const getGameDetailsCached = unstable_cache(
  async (id: number): Promise<IgdbGameDetails | null> => {
    const game = await getGame(id);
    return game ? toGameDetails(game) : null;
  },
  ["igdb-game-details"],
  { revalidate: 60 * 60 * 24 },
);

// ─── Conversões para o que as rotas devolvem ─────────────────────────────────
const names = (list?: { name?: string }[]) =>
  (list ?? []).map((x) => x.name).filter((n): n is string => !!n);

/** Nomes das plataformas; `prefer` escolhe entre nome completo e sigla. */
export function platformNames(
  game: IgdbGame,
  prefer: "name" | "abbreviation" = "name",
): string[] {
  return (game.platforms ?? [])
    .map((p) =>
      prefer === "name" ? p.name || p.abbreviation : p.abbreviation || p.name,
    )
    .filter((n): n is string => !!n);
}

function companyNames(game: IgdbGame, role: "developer" | "publisher") {
  return (game.involved_companies ?? [])
    .filter((c) => c[role])
    .map((c) => c.company?.name)
    .filter((n): n is string => !!n);
}

export function toSearchResult(game: IgdbGame): IgdbSearchResult {
  return {
    id: game.id,
    name: game.name,
    cover: igdbImageUrl(game.cover?.url, "cover_small"),
    year: game.first_release_date
      ? new Date(game.first_release_date * 1000).getUTCFullYear()
      : null,
    platforms: platformNames(game, "abbreviation"),
  };
}

export function toGameDetails(game: IgdbGame): IgdbGameDetails {
  return {
    id: game.id,
    name: game.name,
    summary: game.summary ?? null,
    storyline: game.storyline ?? null,
    url: game.url ?? null,
    releaseDate: game.first_release_date
      ? new Date(game.first_release_date * 1000).toISOString().slice(0, 10)
      : null,
    cover: igdbImageUrl(game.cover?.url, "cover_big"),
    genres: names(game.genres),
    themes: names(game.themes),
    platforms: platformNames(game, "name"),
    developers: companyNames(game, "developer"),
    publishers: companyNames(game, "publisher"),
  };
}
