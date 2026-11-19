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
