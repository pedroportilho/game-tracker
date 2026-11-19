// Auxiliares compartilhados pelos testes.
import type { AuthUser } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/lib/settings";

/** Usuário logado de mentira. */
export function fakeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    email: "jogador@example.com",
    settings: { ...DEFAULT_SETTINGS },
    isAdmin: false,
    ...overrides,
  };
}

/** JWT só com o payload (assinatura falsa) — serve para o middleware, que só lê o exp. */
export function fakeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "ES256", typ: "JWT" })}.${b64(payload)}.c2ln`;
}

export const nowSeconds = () => Math.floor(Date.now() / 1000);

/** Request JSON para chamar um route handler direto. */
export function jsonRequest(
  url: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  return new Request(`http://localhost${url}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/**
 * Simula uma consulta encadeada do supabase-js (from().select().eq()…):
 * qualquer método devolve a própria cadeia, e o `await` resolve `result`.
 * `calls` guarda cada método chamado com seus argumentos.
 */
export function queryChain(result: unknown) {
  const calls: { method: string; args: unknown[] }[] = [];
  const chain: Record<string | symbol, unknown> = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          return (resolve: (v: unknown) => void) => resolve(result);
        }
        return (...args: unknown[]) => {
          calls.push({ method: String(prop), args });
          return chain;
        };
      },
    },
  );
  return { chain, calls };
}
