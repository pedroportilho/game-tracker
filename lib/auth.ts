import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabaseAdmin'

// ─── Cookie helpers ────────────────────────────────────────────────────────────

const IS_PROD = process.env.NODE_ENV === 'production'

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()

  cookieStore.set('sb-access-token', accessToken, {
    httpOnly: true,           // ✅ inacessível pelo JavaScript do browser
    secure: IS_PROD,          // ✅ somente HTTPS em produção
    sameSite: 'lax',
    maxAge: 60 * 60,          // 1 hora (igual ao JWT do Supabase)
    path: '/',
  })

  cookieStore.set('sb-refresh-token', refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: '/',
  })
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')
}

// ─── Token extraction ──────────────────────────────────────────────────────────

export function getAccessTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim()
  }

  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null

  const match = cookieHeader.match(/sb-access-token=([^;]+)/)
  return match?.[1] ?? null
}

function getRefreshTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null

  const match = cookieHeader.match(/sb-refresh-token=([^;]+)/)
  return match?.[1] ?? null
}

// ─── User resolution (com auto-refresh) ───────────────────────────────────────

export async function getUserByAccessToken(accessToken?: string) {
  if (!accessToken) return null

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken)
  if (error || !data.user) return null

  return data.user
}

/**
 * Lê os cookies do servidor, tenta o access token e,
 * se estiver expirado, renova automaticamente via refresh token.
 *
 * ⚠️ Só pode ESCREVER cookies em Server Actions ou Route Handlers.
 * Em Server Components (layout/page), o refresh funciona mas os novos
 * tokens só são salvos se chamado de um contexto permitido.
 */
export async function getUserFromCookies() {
  try {
    const cookieStore = await cookies()
    const accessToken  = cookieStore.get('sb-access-token')?.value
    const refreshToken = cookieStore.get('sb-refresh-token')?.value

    // 1️⃣ Tenta com o access token atual
    if (accessToken) {
      const { data, error } = await supabaseAdmin.auth.getUser(accessToken)
      if (!error && data.user) return data.user
    }

    // 2️⃣ Access token expirado — renova via refresh token
    if (refreshToken) {
      const { data, error } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshToken,
      })

      if (!error && data.session && data.user) {
        // Tenta salvar os novos tokens (só funciona em Server Action / Route Handler)
        try {
          await setAuthCookies(data.session.access_token, data.session.refresh_token)
        } catch {
          // Silencia erro se chamado de Server Component — os cookies expiram naturalmente
        }
        return data.user
      }
    }

    // 3️⃣ Nenhum token válido
    return null

  } catch (err) {
    console.error('Auth error:', err)
    return null
  }
}

/**
 * Mesmo fluxo do getUserFromCookies, mas lendo a partir de um Request
 * (útil em Route Handlers e Middleware).
 */
export async function getUserFromRequest(req: Request) {
  const accessToken  = getAccessTokenFromRequest(req)
  const refreshToken = getRefreshTokenFromRequest(req)

  if (accessToken) {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken)
    if (!error && data.user) return data.user
  }

  if (refreshToken) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (!error && data.session && data.user) {
      await setAuthCookies(data.session.access_token, data.session.refresh_token)
      return data.user
    }
  }

  return null
}
