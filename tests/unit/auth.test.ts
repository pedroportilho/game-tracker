import { describe, expect, it, vi } from "vitest";

// O Supabase é simulado: getClaims é quem confere a assinatura do token
const getClaims = vi.fn();
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { auth: { getClaims: (...a: unknown[]) => getClaims(...a) } },
}));

const { getAccessTokenFromRequest, getUserByAccessToken } = await import("@/lib/auth");

const ISSUER = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`;

function claims(extra: Record<string, unknown> = {}) {
  return {
    data: {
      claims: { sub: "user-1", role: "authenticated", iss: ISSUER, email: "a@b.com", ...extra },
    },
    error: null as Error | null,
  };
}

// (restoreMocks na config limpa as simulações entre os testes)

describe("getUserByAccessToken", () => {
  it("sem token, nem consulta", async () => {
    expect(await getUserByAccessToken(null)).toBeNull();
    expect(getClaims).not.toHaveBeenCalled();
  });

  it("token válido vira usuário com configurações padrão", async () => {
    getClaims.mockResolvedValue(claims());
    expect(await getUserByAccessToken("tok")).toEqual({
      id: "user-1",
      email: "a@b.com",
      settings: { theme: "padrao", platforms: [] },
      isAdmin: false,
    });
  });

  it("lê configurações e admin de dentro do token", async () => {
    getClaims.mockResolvedValue(
      claims({
        user_metadata: { settings: { theme: "nord", platforms: ["PS5"] } },
        app_metadata: { role: "admin" },
      }),
    );
    const user = await getUserByAccessToken("tok");
    expect(user?.settings).toEqual({ theme: "nord", platforms: ["PS5"] });
    expect(user?.isAdmin).toBe(true);
  });

  it("admin só vale pelo app_metadata — user_metadata é editável pelo usuário", async () => {
    getClaims.mockResolvedValue(claims({ user_metadata: { role: "admin" } }));
    expect((await getUserByAccessToken("tok"))?.isAdmin).toBe(false);
  });

  it("assinatura inválida ou token vencido → null", async () => {
    getClaims.mockResolvedValue({ data: null, error: new Error("Invalid JWT signature") });
    expect(await getUserByAccessToken("tok")).toBeNull();
  });

  it("recusa tokens que não são de usuário logado (ex.: chave anon)", async () => {
    getClaims.mockResolvedValue(claims({ role: "anon" }));
    expect(await getUserByAccessToken("tok")).toBeNull();
  });

  it("recusa tokens de outro projeto Supabase", async () => {
    getClaims.mockResolvedValue(claims({ iss: "https://outro.supabase.co/auth/v1" }));
    expect(await getUserByAccessToken("tok")).toBeNull();
  });

  it("erro inesperado não derruba a página: vira null", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    getClaims.mockImplementation(async () => {
      throw new Error("rede");
    });
    expect(await getUserByAccessToken("tok")).toBeNull();
    expect(log).toHaveBeenCalled(); // o erro fica registrado no log do servidor
  });
});

describe("getAccessTokenFromRequest", () => {
  it("lê o header Authorization", () => {
    const req = new Request("http://x", { headers: { authorization: "Bearer abc" } });
    expect(getAccessTokenFromRequest(req)).toBe("abc");
  });

  it("lê o cookie no meio de outros", () => {
    const req = new Request("http://x", {
      headers: { cookie: "tema=1; sb-access-token=xyz; outro=2" },
    });
    expect(getAccessTokenFromRequest(req)).toBe("xyz");
  });

  it("sem token → null", () => {
    expect(getAccessTokenFromRequest(new Request("http://x"))).toBeNull();
  });
});
