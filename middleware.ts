// middleware.ts
// Porteiro do app: sem sessão, qualquer página redireciona para /login.
//
// Também mantém a sessão viva. O access token do Supabase (JWT) vale 1h; antes ele só
// era renovado dentro das páginas, que não podem gravar cookies — o refresh
// token era trocado no Supabase mas o cookie continuava com o antigo, e a
// sessão acabava caindo. Aqui, antes de qualquer página ou API rodar, o token
// é renovado se estiver vencendo, e os cookies novos são gravados na resposta
// E repassados à própria requisição (para a página já ver o token novo).

import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
  type SessionTokens,
} from "@/lib/authCookies";

/** Renova com essa folga antes de vencer, para não expirar no meio da requisição. */
const REFRESH_MARGIN_SECONDS = 120;

/** Lê o `exp` do JWT (sem validar — a validação continua no servidor). */
function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

/** Sessão nova, "invalid" se o refresh token não vale mais, null se falhou a rede. */
async function refreshSession(
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

const LOGIN_PATH = "/login";

function secondsLeft(token: string | undefined): number {
  const exp = token ? tokenExpiresAt(token) : null;
  return exp ? exp - Date.now() / 1000 : -1;
}

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

  // ── 1. Renova a sessão se o access token estiver vencendo ────────────────
  let session: SessionTokens | "invalid" | null = null;
  if (refreshToken && secondsLeft(accessToken) <= REFRESH_MARGIN_SECONDS) {
    session = await refreshSession(refreshToken);
  }

  if (session === "invalid") {
    // Refresh token revogado/expirado: a sessão acabou de vez.
    req.cookies.delete(ACCESS_COOKIE);
    req.cookies.delete(REFRESH_COOKIE);
  } else if (session) {
    // Repassa os tokens novos para esta requisição (a página já vê o novo)
    req.cookies.set(ACCESS_COOKIE, session.access_token);
    req.cookies.set(REFRESH_COOKIE, session.refresh_token);
  }

  // Logado = access token ainda válido. É só para decidir o redirecionamento;
  // a assinatura do token é conferida no servidor (requireUser / APIs).
  // Em falha temporária de rede no refresh, um token ainda não vencido vale.
  const loggedIn =
    session === "invalid"
      ? false
      : session
        ? true
        : secondsLeft(accessToken) > 0;

  // ── 2. Decide para onde vai ──────────────────────────────────────────────
  const { pathname, search } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isLogin = pathname === LOGIN_PATH;
  // O servidor recusou a sessão (token revogado, assinatura inválida) mesmo
  // ela parecendo válida aqui: limpa os cookies em vez de mandar de volta,
  // senão login ↔ página ficariam se redirecionando para sempre.
  const reauth = isLogin && req.nextUrl.searchParams.has("reauth");

  let res: NextResponse;
  if (reauth) {
    res = NextResponse.next({ request: req });
    res.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
    res.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } else if (!loggedIn && !isApi && !isLogin) {
    // Página protegida sem sessão → login, voltando para cá depois
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    res = NextResponse.redirect(url);
  } else if (loggedIn && isLogin) {
    // Já logado: não tem por que ver a tela de login
    const next = req.nextUrl.searchParams.get("next");
    const dest =
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : "/dashboard";
    res = NextResponse.redirect(new URL(dest, req.url));
  } else {
    // APIs seguem e respondem 401 sozinhas quando não há sessão
    res = NextResponse.next({ request: req });
  }

  // ── 3. Grava (ou limpa) os cookies no browser ────────────────────────────
  if (session === "invalid") {
    res.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
    res.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  } else if (session) {
    res.cookies.set(
      ACCESS_COOKIE,
      session.access_token,
      accessCookieOptions(session.expires_in),
    );
    res.cookies.set(REFRESH_COOKIE, session.refresh_token, refreshCookieOptions);
  }
  return res;
}

export const config = {
  // Tudo, menos arquivos estáticos (imagens, _next/static, etc.)
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?)$).*)",
  ],
};
