import { afterEach, describe, expect, it, vi } from "vitest";

// lib/api.ts chama sessionExpired() no 401 (que navega para o login)
const sessionExpired = vi.fn();
vi.mock("@/lib/authClient", () => ({ sessionExpired: () => sessionExpired() }));

const { api, errorText } = await import("@/lib/api");

function mockFetch(response: Response | Error) {
  const fn = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  sessionExpired.mockReset();
});

describe("api()", () => {
  it("devolve o JSON da resposta", async () => {
    mockFetch(Response.json({ id: 1 }));
    expect(await api<{ id: number }>("/api/x", { errorMessage: "erro" })).toEqual({ id: 1 });
  });

  it("envia corpo como JSON", async () => {
    const fetch = mockFetch(Response.json({}));
    await api("/api/x", { method: "PUT", body: { a: 1 }, errorMessage: "erro" });
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("PUT");
    expect(init.body).toBe('{"a":1}');
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("resposta sem corpo (204) → undefined", async () => {
    mockFetch(new Response(null, { status: 204 }));
    expect(await api("/api/x", { method: "DELETE", errorMessage: "erro" })).toBeUndefined();
  });

  it("401 manda para o login e lança aviso de sessão", async () => {
    mockFetch(new Response("{}", { status: 401 }));
    await expect(api("/api/x", { errorMessage: "erro" })).rejects.toThrow("Sua sessão expirou");
    expect(sessionExpired).toHaveBeenCalledOnce();
  });

  it("outros erros lançam a mensagem em pt-BR de quem chamou", async () => {
    mockFetch(new Response("detalhe técnico", { status: 500 }));
    await expect(
      api("/api/x", { errorMessage: "Não foi possível salvar." }),
    ).rejects.toThrow("Não foi possível salvar.");
    expect(sessionExpired).not.toHaveBeenCalled();
  });

  it("sem conexão, avisa para verificar a conexão", async () => {
    mockFetch(new TypeError("Failed to fetch"));
    await expect(api("/api/x", { errorMessage: "Não foi possível salvar." })).rejects.toThrow(
      "Não foi possível salvar. Verifique sua conexão.",
    );
  });
});

describe("errorText", () => {
  it("mensagem de Error ou texto de reserva", () => {
    expect(errorText(new Error("ops"))).toBe("ops");
    expect(errorText("string solta")).toBe("Algo deu errado.");
    expect(errorText(42, "reserva")).toBe("reserva");
  });
});
