import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  refreshSession,
  setSessionCookies,
} from "@/lib/authCookies";

const session = { access_token: "novo-access", refresh_token: "novo-refresh", expires_in: 3600 };

function mockFetch(response: Response | Error) {
  const fn = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("refreshSession", () => {
  it("troca o refresh token por uma sessão nova", async () => {
    const fetch = mockFetch(Response.json(session));
    expect(await refreshSession("velho")).toEqual(session);

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/auth/v1/token?grant_type=refresh_token");
    expect(JSON.parse(init.body as string)).toEqual({ refresh_token: "velho" });
  });

  it.each([400, 401])("%s = refresh token revogado → 'invalid'", async (status) => {
    mockFetch(new Response("{}", { status }));
    expect(await refreshSession("velho")).toBe("invalid");
  });

  it("erro do servidor → null (tentar de novo depois, sem deslogar)", async () => {
    mockFetch(new Response("{}", { status: 503 }));
    expect(await refreshSession("velho")).toBeNull();
  });

  it("falha de rede → null", async () => {
    mockFetch(new Error("offline"));
    expect(await refreshSession("velho")).toBeNull();
  });

  it("resposta sem tokens → null", async () => {
    mockFetch(Response.json({ access_token: "só um" }));
    expect(await refreshSession("velho")).toBeNull();
  });
});

describe("cookies de sessão", () => {
  function jar() {
    const set = vi.fn();
    return { set, get: (name: string) => set.mock.calls.find((c) => c[0] === name) };
  }

  it("access token expira junto com o JWT; refresh dura 1 ano", () => {
    const j = jar();
    setSessionCookies(j, session);
    expect(j.get(ACCESS_COOKIE)?.[2]).toMatchObject({ maxAge: 3600, httpOnly: true, path: "/" });
    expect(j.get(REFRESH_COOKIE)?.[2]).toMatchObject({ maxAge: 60 * 60 * 24 * 365, httpOnly: true });
  });

  it("limpar apaga os dois", () => {
    const j = jar();
    clearSessionCookies(j);
    expect(j.get(ACCESS_COOKIE)?.slice(1)).toEqual(["", { path: "/", maxAge: 0 }]);
    expect(j.get(REFRESH_COOKIE)?.slice(1)).toEqual(["", { path: "/", maxAge: 0 }]);
  });
});
