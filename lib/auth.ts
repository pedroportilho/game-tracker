import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "./supabaseAdmin";
import { ACCESS_COOKIE } from "./authCookies";

// A renovação da sessão (refresh token) acontece no middleware.ts, antes de
// qualquer página ou rota rodar. Aqui só validamos o access token.
//
// Antes estas funções também renovavam a sessão — mas, em páginas (Server
// Components), os cookies novos não podiam ser gravados: o Supabase trocava o
// refresh token e o browser continuava com o antigo, já revogado.

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

export async function getUserByAccessToken(accessToken?: string | null) {
  if (!accessToken) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) return null;

  return data.user;
}

/** Usuário da sessão atual em páginas (Server Components). */
export async function getUserFromCookies() {
  try {
    const cookieStore = await cookies();
    return await getUserByAccessToken(cookieStore.get(ACCESS_COOKIE)?.value);
  } catch (err) {
    console.error("Auth error:", err);
    return null;
  }
}

/**
 * Usuário logado em páginas protegidas. O middleware já barra quem não tem
 * sessão; isto cobre o caso raro de o token parecer válido mas o Supabase
 * recusar (sessão revogada) — aí volta ao login limpando os cookies.
 */
export async function requireUser() {
  const user = await getUserFromCookies();
  if (!user) redirect("/login?reauth=1");
  return user;
}

/** Mesmo que getUserFromCookies, lendo de um Request (Route Handlers). */
export async function getUserFromRequest(req: Request) {
  return getUserByAccessToken(getAccessTokenFromRequest(req));
}
