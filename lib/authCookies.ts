// lib/authCookies.ts
// Nomes e opções dos cookies de sessão. Sem imports de servidor (next/headers,
// supabaseAdmin) para poder ser usado também no middleware (edge runtime).

export const ACCESS_COOKIE = "sb-access-token";
export const REFRESH_COOKIE = "sb-refresh-token";

const IS_PROD = process.env.NODE_ENV === "production";

const base = {
  httpOnly: true, // inacessível pelo JavaScript do browser
  secure: IS_PROD, // somente HTTPS em produção
  sameSite: "lax" as const,
  path: "/",
};

/** O access token (JWT) vale pouco tempo — o cookie expira junto com ele. */
export function accessCookieOptions(expiresIn: number) {
  return { ...base, maxAge: expiresIn };
}

/**
 * O refresh token é o que mantém o login. A validade é renovada a cada
 * refresh, então a sessão só cai depois de 1 ano SEM abrir o site.
 */
export const refreshCookieOptions = { ...base, maxAge: 60 * 60 * 24 * 365 };

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

/** Algo onde se pode gravar cookies (NextResponse.cookies). */
type CookieJar = {
  set(name: string, value: string, options?: Record<string, unknown>): unknown;
};

/** Grava os cookies de uma sessão nova na resposta. */
export function setSessionCookies(cookies: CookieJar, session: SessionTokens) {
  cookies.set(ACCESS_COOKIE, session.access_token, accessCookieOptions(session.expires_in));
  cookies.set(REFRESH_COOKIE, session.refresh_token, refreshCookieOptions);
}

/** Apaga os cookies de sessão. */
export function clearSessionCookies(cookies: CookieJar) {
  cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
}

/**
 * Troca o refresh token por uma sessão nova no Supabase.
 * Devolve a sessão, "invalid" se o refresh token não vale mais, ou null se
 * falhou a rede (aí vale tentar de novo depois).
 */
export async function refreshSession(
  refreshToken: string,
): Promise<SessionTokens | "invalid" | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      },
    );
    if (res.status === 400 || res.status === 401) return "invalid";
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access_token || !data.refresh_token) return null;
    return data as SessionTokens;
  } catch {
    return null;
  }
}
