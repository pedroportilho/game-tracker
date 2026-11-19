import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "./supabaseAdmin";
import { ACCESS_COOKIE } from "./authCookies";
import { parseSettings, type UserSettings } from "./settings";

// A renovação da sessão (refresh token) acontece no middleware.ts, antes de
// qualquer página ou rota rodar. Aqui só validamos o access token.
//
// A validação é LOCAL: o Supabase assina os tokens com uma chave ES256 e
// publica a chave pública (JWKS); getClaims() confere a assinatura e a
// validade aqui mesmo, guardando a chave em cache. Antes usávamos getUser(),
// que perguntava ao Supabase a cada página e a cada API (~200 ms cada vez).
//
// Custo da troca: um access token continua aceito até vencer (no máximo 1h),
// mesmo que a sessão seja revogada no Supabase. O logout apaga os cookies,
// então isso só importaria se alguém copiasse o token antes.

export type AuthUser = {
  id: string;
  email: string | null;
  /** Configurações salvas na conta (vêm no próprio token, sem consulta) */
  settings: UserSettings;
  /**
   * Administrador do site: app_metadata.role === "admin". O app_metadata só
   * pode ser alterado com a chave de serviço (nunca pelo próprio usuário).
   */
  isAdmin: boolean;
};

const ISSUER = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`;

// ─── Token extraction ──────────────────────────────────────────────────────────

export function getAccessTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${ACCESS_COOKIE}=([^;]+)`),
  );
  return match?.[1] ?? null;
}

// ─── User resolution ──────────────────────────────────────────────────────────

/** Usuário dono do token, ou null se o token for inválido/vencido. */
export async function getUserByAccessToken(
  accessToken?: string | null,
): Promise<AuthUser | null> {
  if (!accessToken) return null;

  try {
    // Confere assinatura e expiração (exp)
    const { data, error } = await supabaseAdmin.auth.getClaims(accessToken);
    if (error || !data) return null;

    const { sub, role, iss, email, user_metadata, app_metadata } = data.claims;
    // Só tokens de usuário logado emitidos por este projeto (não aceita,
    // por exemplo, a chave anon, que também é um JWT assinado)
    if (!sub || role !== "authenticated" || iss !== ISSUER) return null;

    return {
      id: sub,
      email: email ?? null,
      settings: parseSettings(user_metadata?.settings),
      isAdmin: app_metadata?.role === "admin",
    };
  } catch (err) {
    console.error("Auth error:", err);
    return null;
  }
}

/**
 * Usuário da sessão atual em páginas (Server Components). cache(): o título
 * da aba (generateMetadata) e a página compartilham a mesma verificação.
 */
export const getUserFromCookies = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  return getUserByAccessToken(cookieStore.get(ACCESS_COOKIE)?.value);
});

/**
 * Usuário logado em páginas protegidas. O middleware já barra quem não tem
 * sessão; isto cobre o caso de o token parecer válido mas a assinatura não
 * conferir — aí volta ao login limpando os cookies.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getUserFromCookies();
  if (!user) redirect("/login?reauth=1");
  return user;
}

/** Mesmo que getUserFromCookies, lendo de um Request (Route Handlers). */
export async function getUserFromRequest(req: Request) {
  return getUserByAccessToken(getAccessTokenFromRequest(req));
}
