import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { fakeJwt, nowSeconds } from "./helpers";

// A renovação no Supabase é simulada; o resto do authCookies é o real
const refreshSession = vi.fn();
vi.mock("@/lib/authCookies", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/authCookies")>()),
  refreshSession: (...a: unknown[]) => refreshSession(...a),
}));

const { middleware } = await import("@/middleware");

const valid = fakeJwt({ exp: nowSeconds() + 3600 });
const expiring = fakeJwt({ exp: nowSeconds() + 60 }); // dentro da folga de 2 min
const expired = fakeJwt({ exp: nowSeconds() - 60 });

function request(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
  return new NextRequest(`http://localhost${path}`, { headers: cookie ? { cookie } : {} });
}

const passes = (res: Response) => res.headers.get("x-middleware-next") === "1";
const location = (res: Response) => {
  const loc = res.headers.get("location");
  return loc ? new URL(loc).pathname + new URL(loc).search : null;
};

beforeEach(() => refreshSession.mockReset());

describe("sem login", () => {
  it("página protegida → login, voltando para ela depois", async () => {
    const res = await middleware(request("/games?filtro=1"));
    expect(res.status).toBe(307);
    expect(location(res)).toBe("/login?next=%2Fgames%3Ffiltro%3D1");
  });

  it("a tela de login abre", async () => {
    expect(passes(await middleware(request("/login")))).toBe(true);
  });

  it("APIs seguem (elas mesmas respondem 401)", async () => {
    expect(passes(await middleware(request("/api/games")))).toBe(true);
  });
});

describe("com login", () => {
  it("token válido passa sem renovar", async () => {
    const res = await middleware(request("/games", { "sb-access-token": valid }));
    expect(passes(res)).toBe(true);
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("logado na tela de login vai para o dashboard", async () => {
    const res = await middleware(request("/login", { "sb-access-token": valid }));
    expect(location(res)).toBe("/dashboard");
  });

  it("respeita o ?next= interno", async () => {
    const res = await middleware(request("/login?next=/series", { "sb-access-token": valid }));
    expect(location(res)).toBe("/series");
  });

  it("não segue ?next= para outro site (open redirect)", async () => {
    const res = await middleware(request("/login?next=//malicioso.com", { "sb-access-token": valid }));
    expect(location(res)).toBe("/dashboard");
  });
});

describe("renovação da sessão", () => {
  const novo = { access_token: valid, refresh_token: "refresh-novo", expires_in: 3600 };

  it("token perto de vencer é renovado e os cookies novos são gravados", async () => {
    refreshSession.mockResolvedValue(novo);
    const res = await middleware(
      request("/games", { "sb-access-token": expiring, "sb-refresh-token": "refresh-velho" }),
    );
    expect(refreshSession).toHaveBeenCalledWith("refresh-velho");
    expect(passes(res)).toBe(true);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("sb-refresh-token=refresh-novo");
  });

  it("refresh revogado: desloga e limpa os cookies", async () => {
    refreshSession.mockResolvedValue("invalid");
    const res = await middleware(
      request("/games", { "sb-access-token": expired, "sb-refresh-token": "revogado" }),
    );
    expect(location(res)).toBe("/login?next=%2Fgames");
    expect(res.headers.get("set-cookie")).toMatch(/sb-access-token=;.*Max-Age=0/i);
  });

  it("falha de rede no refresh com token ainda válido: deixa passar", async () => {
    refreshSession.mockResolvedValue(null);
    const res = await middleware(
      request("/games", { "sb-access-token": expiring, "sb-refresh-token": "r" }),
    );
    expect(passes(res)).toBe(true);
  });

  it("falha de rede com token já vencido: vai para o login", async () => {
    refreshSession.mockResolvedValue(null);
    const res = await middleware(
      request("/games", { "sb-access-token": expired, "sb-refresh-token": "r" }),
    );
    expect(res.status).toBe(307);
  });
});

it("login?reauth=1 limpa os cookies em vez de redirecionar (evita loop)", async () => {
  const res = await middleware(request("/login?reauth=1", { "sb-access-token": valid }));
  expect(passes(res)).toBe(true);
  expect(res.headers.get("set-cookie")).toMatch(/sb-access-token=;/);
});
