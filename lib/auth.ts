import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabaseAdmin'

export async function getUserByAccessToken(accessToken?: string) {
  if (!accessToken) return null

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken)
  if (error || !data.user) return null

  return data.user
}

export async function getUserFromCookies() {
  const token = (await cookies()).get('sb-access-token')?.value
  return getUserByAccessToken(token)
}

export function getAccessTokenFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim()
  }

  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null

  const match = cookieHeader.match(/sb-access-token=([^;]+)/)
  return match?.[1] ?? null
}

export async function getUserFromRequest(req: Request) {
  const token = getAccessTokenFromRequest(req)
  return getUserByAccessToken(token)
}
