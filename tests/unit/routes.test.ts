import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { AuthUser } from "@/lib/auth";
import { fakeUser, jsonRequest, queryChain } from "./helpers";

// ─── Simulações ──────────────────────────────────────────────────────────────
// Nada aqui alcança o banco, a IGDB ou o Supabase Auth de verdade.
const mocks = vi.hoisted(() => ({
  user: null as AuthUser | null,
  from: vi.fn(),
  updateUserById: vi.fn(),
  refreshSession: vi.fn(),
  revalidateTag: vi.fn(),
  createGame: vi.fn(),
  updateGame: vi.fn(),
  getGames: vi.fn(),
  getSeries: vi.fn(),
  getChecklistProgress: vi.fn(),
  setChecklistProgress: vi.fn(),
  getGame: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getUserFromRequest: async () => mocks.user }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (...a: unknown[]) => mocks.from(...a),
    auth: { admin: { updateUserById: (...a: unknown[]) => mocks.updateUserById(...a) } },
  },
}));
vi.mock("next/cache", () => ({
  unstable_cache: <T>(fn: T) => fn,
  revalidateTag: (...a: unknown[]) => mocks.revalidateTag(...a),
}));
vi.mock("@/lib/authCookies", async (orig) => ({
  ...(await orig<typeof import("@/lib/authCookies")>()),
  refreshSession: (...a: unknown[]) => mocks.refreshSession(...a),
}));
vi.mock("@/lib/gamesData", async (orig) => ({
  ...(await orig<typeof import("@/lib/gamesData")>()),
  createGame: (...a: unknown[]) => mocks.createGame(...a),
  updateGame: (...a: unknown[]) => mocks.updateGame(...a),
  getGames: (...a: unknown[]) => mocks.getGames(...a),
}));
vi.mock("@/lib/seriesData", () => ({ getSeries: (...a: unknown[]) => mocks.getSeries(...a) }));
vi.mock("@/lib/checklistsData", async (orig) => ({
  ...(await orig<typeof import("@/lib/checklistsData")>()),
  getChecklistProgress: (...a: unknown[]) => mocks.getChecklistProgress(...a),
  setChecklistProgress: (...a: unknown[]) => mocks.setChecklistProgress(...a),
}));
vi.mock("@/lib/igdb", async (orig) => ({
  ...(await orig<typeof import("@/lib/igdb")>()),
  getGame: (...a: unknown[]) => mocks.getGame(...a),
}));

import * as gamesRoute from "@/app/api/games/route";
import * as gameRoute from "@/app/api/games/[id]/route";
import * as settingsRoute from "@/app/api/settings/route";
import * as syncRoute from "@/app/api/igdb/sync-covers/route";
import * as refreshRoute from "@/app/api/checklists/refresh/route";
import * as progressRoute from "@/app/api/checklists/progress/route";
import * as exportRoute from "@/app/api/export/route";

beforeEach(() => {
  mocks.user = fakeUser();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const params = (id: string) => ({ params: Promise.resolve({ id }) });

// ─── Login obrigatório em todas as rotas ─────────────────────────────────────
describe("sem login, toda rota responde 401", () => {
  it.each([
    ["POST /api/games", () => gamesRoute.POST(jsonRequest("/api/games", "POST", {}))],
    ["PUT /api/games/1", () => gameRoute.PUT(jsonRequest("/api/games/1", "PUT", {}), params("1"))],
    ["DELETE /api/games/1", () => gameRoute.DELETE(jsonRequest("/api/games/1", "DELETE"), params("1"))],
    ["PUT /api/settings", () => settingsRoute.PUT(new NextRequest(jsonRequest("/api/settings", "PUT", {})))],
    ["POST /api/igdb/sync-covers", () => syncRoute.POST(jsonRequest("/api/igdb/sync-covers", "POST"))],
    ["POST /api/checklists/refresh", () => refreshRoute.POST(jsonRequest("/api/checklists/refresh", "POST"))],
    ["PATCH /api/checklists/progress", () => progressRoute.PATCH(jsonRequest("/api/checklists/progress", "PATCH", {}))],
    ["GET /api/export", () => exportRoute.GET(jsonRequest("/api/export", "GET"))],
  ])("%s", async (_name, call) => {
    mocks.user = null;
    expect((await call()).status).toBe(401);
  });
});

// ─── Jogos ───────────────────────────────────────────────────────────────────
describe("jogos: só os campos do formulário são gravados", () => {
  const body = {
    title: "Celeste",
    platform: "Switch",
    platinum: true,
    id: "id-forjado",
    user_id: "outra-conta", // tentativa de mover o jogo para outra conta
    created_at: "2020-01-01",
  };

  it("POST descarta id e user_id", async () => {
    mocks.createGame.mockResolvedValue({ id: "novo" });
    const res = await gamesRoute.POST(jsonRequest("/api/games", "POST", body));
    expect(res.status).toBe(201);
    expect(mocks.createGame).toHaveBeenCalledWith(
      { title: "Celeste", platform: "Switch", platinum: true },
      "user-1",
    );
  });

  it("PUT descarta user_id (não dá para transferir o jogo)", async () => {
    mocks.updateGame.mockResolvedValue({ id: "1" });
    await gameRoute.PUT(jsonRequest("/api/games/1", "PUT", body), params("1"));
    expect(mocks.updateGame).toHaveBeenCalledWith(
      "1",
      { title: "Celeste", platform: "Switch", platinum: true },
      "user-1",
    );
  });
});

// ─── Configurações ───────────────────────────────────────────────────────────
describe("PUT /api/settings", () => {
  function put(body: unknown, cookie?: string) {
    return settingsRoute.PUT(
      new NextRequest(
        jsonRequest("/api/settings", "PUT", body, cookie ? { cookie } : {}),
      ),
    );
  }

  beforeEach(() => {
    mocks.user = fakeUser({ settings: { theme: "dracula", platforms: ["N64"] } });
    mocks.updateUserById.mockResolvedValue({ error: null });
    mocks.refreshSession.mockResolvedValue(null);
  });

  it("salva só o que mudou, mantendo o resto", async () => {
    const res = await put({ theme: "nord" });
    expect(await res.json()).toEqual({ settings: { theme: "nord", platforms: ["N64"] } });
    expect(mocks.updateUserById).toHaveBeenCalledWith("user-1", {
      user_metadata: { settings: { theme: "nord", platforms: ["N64"] } },
    });
  });

  it("valor inválido mantém o atual", async () => {
    const res = await put({ theme: "<script>", platforms: "todas" });
    expect(await res.json()).toEqual({ settings: { theme: "dracula", platforms: ["N64"] } });
  });

  it("não deixa o usuário se dar admin pelo corpo da requisição", async () => {
    await put({ theme: "nord", role: "admin", isAdmin: true });
    const [, payload] = mocks.updateUserById.mock.calls[0];
    expect(payload).toEqual({ user_metadata: { settings: { theme: "nord", platforms: ["N64"] } } });
  });

  it("renova a sessão deste aparelho para o tema valer na hora", async () => {
    mocks.refreshSession.mockResolvedValue({
      access_token: "access-novo",
      refresh_token: "refresh-novo",
      expires_in: 3600,
    });
    const res = await put({ theme: "nord" }, "sb-refresh-token=refresh-velho");
    expect(mocks.refreshSession).toHaveBeenCalledWith("refresh-velho");
    expect(res.headers.get("set-cookie")).toContain("sb-access-token=access-novo");
  });

  it("erro do Supabase → 500", async () => {
    mocks.updateUserById.mockResolvedValue({ error: new Error("falhou") });
    expect((await put({ theme: "nord" })).status).toBe(500);
  });
});

// ─── Ferramentas de admin ────────────────────────────────────────────────────
describe("ferramentas de admin", () => {
  it.each([
    ["sync-covers", () => syncRoute.POST(jsonRequest("/x", "POST"))],
    ["refresh", () => refreshRoute.POST(jsonRequest("/x", "POST"))],
  ])("%s recusa quem não é admin (403)", async (_name, call) => {
    mocks.user = fakeUser({ isAdmin: false });
    expect((await call()).status).toBe(403);
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("refresh limpa o cache dos checklists", async () => {
    mocks.user = fakeUser({ isAdmin: true });
    const res = await refreshRoute.POST(jsonRequest("/x", "POST"));
    expect(res.status).toBe(200);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("checklist-structure");
  });

  it("sync-covers: só consulta jogos sem capa ou nunca consultados", async () => {
    mocks.user = fakeUser({ isAdmin: true });
    const select = queryChain({ data: [], error: null });
    mocks.from.mockReturnValue(select.chain);

    const res = await syncRoute.POST(jsonRequest("/x", "POST"));
    expect(await res.json()).toMatchObject({ updated: 0 });
    const filter = select.calls.find((c) => c.method === "or");
    // themes = [] (já consultado, a IGDB não tem) não volta para a fila
    expect(filter?.args[0]).toBe("cover.is.null,themes.is.null");
  });

  it("sync-covers: grava temas vazios para marcar o jogo como consultado", async () => {
    mocks.user = fakeUser({ isAdmin: true });
    const select = queryChain({
      data: [{ id: "g1", igdb_id: 99, cover: "https://capa", themes: null }],
      error: null,
    });
    const update = queryChain({ error: null });
    mocks.from.mockReturnValueOnce(select.chain).mockReturnValueOnce(update.chain);
    mocks.getGame.mockResolvedValue({ id: 99, name: "Jogo", themes: [] });

    const res = await syncRoute.POST(jsonRequest("/x", "POST"));
    expect(await res.json()).toMatchObject({ updated: 1 });
    expect(update.calls.find((c) => c.method === "update")?.args[0]).toEqual({ themes: [] });
    // e só no jogo do próprio usuário
    expect(update.calls.filter((c) => c.method === "eq").map((c) => c.args)).toContainEqual([
      "user_id",
      "user-1",
    ]);
  });
});

// ─── Progresso dos checklists ────────────────────────────────────────────────
describe("PATCH /api/checklists/progress", () => {
  const patch = (body: unknown) =>
    progressRoute.PATCH(jsonRequest("/api/checklists/progress", "PATCH", body));

  it("corpo inválido → 400", async () => {
    expect((await patch({ itemId: 1, value: "x" })).status).toBe(400);
  });

  it("valor acima do máximo → 400", async () => {
    mocks.setChecklistProgress.mockRejectedValue(new Error("Value exceeds max"));
    expect((await patch({ itemId: "zelda-oot.songs.zelda", value: 9 })).status).toBe(400);
  });

  it("grava e devolve o valor salvo", async () => {
    mocks.setChecklistProgress.mockResolvedValue(1);
    const res = await patch({ itemId: "zelda-oot.songs.zelda", value: 1 });
    expect(await res.json()).toEqual({ value: 1 });
    expect(mocks.setChecklistProgress).toHaveBeenCalledWith("user-1", "zelda-oot.songs.zelda", 1);
  });
});

// ─── Exportação ──────────────────────────────────────────────────────────────
describe("GET /api/export", () => {
  const games = [
    {
      title: 'Jogo "com aspas"; e ponto e vírgula',
      platform: "PS5",
      game_status: "Completed",
      account_status: "Preserved",
      platinum: true,
      completion: 1,
      date: "2024-03-05",
      genres: ["RPG", "Adventure"],
      themes: [] as string[],
      notes: null as string | null,
      igdb_id: 7,
    },
  ];

  beforeEach(() => {
    mocks.getGames.mockResolvedValue(games);
    mocks.getSeries.mockResolvedValue([{ id: 1, name: "Zelda", entries: [] }]);
    mocks.getChecklistProgress.mockResolvedValue({ "zelda-oot.x": 1 });
  });

  it("CSV para o Excel brasileiro: BOM, ';' e aspas escapadas", async () => {
    const res = await exportRoute.GET(jsonRequest("/api/export?format=csv", "GET"));
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toMatch(/filename="ludora-\d{4}-\d{2}-\d{2}\.csv"/);

    const bytes = new Uint8Array(await res.arrayBuffer());
    // BOM UTF-8 (EF BB BF): é o que faz o Excel reconhecer os acentos
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = new TextDecoder().decode(bytes); // o decoder já remove o BOM
    const [header, row] = text.split("\r\n");
    expect(header.split(";")[0]).toBe("title");
    expect(row).toContain('"Jogo ""com aspas""; e ponto e vírgula"');
    expect(row).toContain('"RPG, Adventure"');
  });

  it("JSON leva jogos, séries e checklists", async () => {
    const res = await exportRoute.GET(jsonRequest("/api/export?format=json", "GET"));
    const data = await res.json();
    expect(Object.keys(data)).toEqual(["exportedAt", "games", "series", "checklistProgress"]);
    expect(mocks.getGames).toHaveBeenCalledWith("user-1");
  });
});
