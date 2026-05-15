// IGDB API client — auth via Twitch OAuth client_credentials flow.
// Docs: https://api-docs.igdb.com/

const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const IGDB_BASE = 'https://api.igdb.com/v4'

let cachedToken = null // { value, expiresAt }

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value
  }
  const id = process.env.TWITCH_CLIENT_ID
  const secret = process.env.TWITCH_CLIENT_SECRET
  if (!id || !secret) throw new Error('Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET')

  const params = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    grant_type: 'client_credentials',
  })
  const res = await fetch(`${TWITCH_TOKEN_URL}?${params}`, { method: 'POST' })
  if (!res.ok) throw new Error(`Twitch token error ${res.status}: ${await res.text()}`)
  const json = await res.json()
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  }
  return cachedToken.value
}

async function igdbQuery(endpoint, body) {
  const token = await getAccessToken()
  const res = await fetch(`${IGDB_BASE}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
      Accept: 'application/json',
    },
    body,
  })
  if (!res.ok) throw new Error(`IGDB ${endpoint} error ${res.status}: ${await res.text()}`)
  return res.json()
}

// IGDB cover URLs come as "//images.igdb.com/.../t_thumb/..." — upgrade size + protocol
export function igdbImageUrl(url, size = 'cover_big') {
  if (!url) return null
  return ('https:' + url).replace('t_thumb', `t_${size}`)
}

export async function searchGames(query, limit = 10) {
  if (!query || query.trim().length < 2) return []
  const safeQuery = query.replace(/"/g, '\\"')
  const body = `
    search "${safeQuery}";
    fields id, name, cover.url, first_release_date, platforms.abbreviation, platforms.name;
    limit ${limit};
  `
  return igdbQuery('games', body)
}

export async function getGame(id) {
  const numId = Number(id)
  if (!numId) return null
  const body = `
    fields
      id, name, summary, storyline, first_release_date, url,
      cover.url,
      genres.name,
      platforms.abbreviation, platforms.name,
      involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
    where id = ${numId};
  `
  const arr = await igdbQuery('games', body)
  return arr[0] ?? null
}

// Best-effort title match for migration. Returns IGDB id or null.
export async function findBestMatch(title) {
  const results = await searchGames(title, 5)
  if (results.length === 0) return null
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const target = norm(title)
  const exact = results.find((r) => norm(r.name) === target)
  return (exact ?? results[0]).id
}
