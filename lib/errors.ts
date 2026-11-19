// lib/errors.ts
// Usado no servidor (rotas) e no navegador.

/** Mensagem de um erro capturado em catch (que no TS é `unknown`). */
export function errorText(err: unknown, fallback = "Algo deu errado.") {
  return err instanceof Error ? err.message : fallback;
}
