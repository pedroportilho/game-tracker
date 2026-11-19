// Teste de fumaça: confere o site de verdade, rodando (npm run dev).
//
//   npm run test:smoke
//
// Sem credenciais, testa o que dá para ver sem login. Com SMOKE_EMAIL e
// SMOKE_PASSWORD no ambiente, também entra na conta e abre as páginas
// logadas (só leitura: nada é gravado) e sai no fim.
//
//   $env:SMOKE_EMAIL="..."; $env:SMOKE_PASSWORD="..."; npm run test:smoke
//
// Não sobe servidor: dois `next dev` na mesma pasta .next quebram o site.

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const BASE = process.env.SMOKE_URL ?? "http://localhost:3000";
const EMAIL = process.env.SMOKE_EMAIL;
const PASSWORD = process.env.SMOKE_PASSWORD;

const PAGES = [
  "/dashboard",
  "/games",
  "/series",
  "/backlog",
  "/checklists",
  "/checklists/zelda-oot",
  "/settings",
];

function get(path: string, cookie?: string, init: RequestInit = {}) {
  return fetch(BASE + path, {
    redirect: "manual",
    ...init,
    headers: { ...(cookie ? { cookie } : {}), ...(init.headers ?? {}) },
  });
}

/** Folhas de estilo (<link rel="stylesheet">) de uma página. */
function stylesheets(html: string) {
  return [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) =>
    m[1].replace(/&amp;/g, "&"),
  );
}

/** Confere se cada CSS da página é servido. Pega o erro de CSS faltando no .next. */
async function expectStylesLoad(html: string, cookie?: string) {
  const hrefs = stylesheets(html);
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    const res = await get(href, cookie);
    expect(res.status, `CSS ${href}`).toBe(200);
    expect((await res.text()).length, `CSS ${href} vazio`).toBeGreaterThan(0);
  }
}

/** Token com cara de válido (vence daqui a 1h), mas assinatura falsa. */
function forgedToken() {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64({ alg: "ES256", kid: "falso", typ: "JWT" })}.${b64({ sub: "x", role: "authenticated", exp })}.${Buffer.alloc(64).toString("base64url")}`;
}

beforeAll(async () => {
  try {
    await fetch(BASE + "/login", { redirect: "manual" });
  } catch {
    throw new Error(`Servidor fora do ar em ${BASE}. Rode "npm run dev" antes.`);
  }
});

describe("sem login", () => {
  it("a tela de login abre, com nome, tema e CSS", async () => {
    const res = await get("/login");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<title>Entrar · Ludora</title>");
    expect(html).toContain('<style id="theme-vars">');
    await expectStylesLoad(html);
  });

  it.each(PAGES)("%s → login", async (path) => {
    const res = await get(path);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain(`/login?next=${encodeURIComponent(path)}`);
  });

  it.each([
    ["POST", "/api/games"],
    ["PUT", "/api/games/1"],
    ["DELETE", "/api/games/1"],
    ["POST", "/api/series"],
    ["PATCH", "/api/series/entry"],
    ["PATCH", "/api/checklists/progress"],
    ["POST", "/api/checklists/refresh"],
    ["PUT", "/api/settings"],
    ["GET", "/api/export"],
    ["GET", "/api/igdb/search?q=zelda"],
    ["POST", "/api/igdb/sync-covers"],
  ])("%s %s → 401", async (method, path) => {
    const res = await get(path, undefined, { method });
    expect(res.status).toBe(401);
  });
});

describe("token forjado (assinatura falsa)", () => {
  const cookie = `sb-access-token=${forgedToken()}`;

  it("páginas recusam e limpam a sessão", async () => {
    const res = await get("/games", cookie);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?reauth=1");
  });

  it("APIs recusam", async () => {
    const res = await get("/api/export", cookie);
    expect(res.status).toBe(401);
  });
});

describe.skipIf(!EMAIL || !PASSWORD)("com login (SMOKE_EMAIL / SMOKE_PASSWORD)", () => {
  let cookie = "";

  beforeAll(async () => {
    const res = await fetch(BASE + "/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, mode: "login" }),
    });
    expect(res.status, "login falhou — confira SMOKE_EMAIL/SMOKE_PASSWORD").toBe(200);
    cookie = res.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
  });

  afterAll(async () => {
    // Sai: revoga a sessão criada pelo teste
    if (cookie) await get("/api/auth", cookie, { method: "DELETE" });
  });

  it.each(PAGES)("%s abre, com CSS", async (path) => {
    const res = await get(path, cookie);
    expect(res.status, `${path} respondeu ${res.status}`).toBe(200);
    const html = await res.text();
    expect(html).not.toContain("Não foi possível carregar a página");
    await expectStylesLoad(html, cookie);
  });

  it("a página de um jogo abre", async () => {
    const html = await (await get("/games", cookie)).text();
    const id = html.match(/href="\/games\/([^"/]+)"/)?.[1];
    expect(id, "nenhum jogo na lista").toBeTruthy();
    const res = await get(`/games/${id}`, cookie);
    expect(res.status).toBe(200);
  });

  it("logado, /login manda para o dashboard", async () => {
    const res = await get("/login", cookie);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("exportação em JSON funciona", async () => {
    const res = await get("/api/export?format=json", cookie);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.games)).toBe(true);
  });

  it("busca na IGDB responde", async () => {
    const res = await get("/api/igdb/search?q=zelda", cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});
