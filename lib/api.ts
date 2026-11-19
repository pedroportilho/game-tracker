// lib/api.ts
// Chamadas do navegador para as rotas /api do próprio site. Todas passam por
// aqui para tratar os erros do mesmo jeito:
//   - 401 (sessão acabou no meio do uso) → leva para o login e volta depois;
//   - qualquer outra falha → lança Error com uma mensagem em pt-BR, que quem
//     chamou mostra com showError() (components/ui/Toaster).

import { sessionExpired } from "./authClient";

export { errorText } from "./errors";

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** mensagem mostrada ao usuário se a chamada falhar */
  errorMessage: string;
  /** mantém a requisição viva se a aba for fechada (gravações rápidas) */
  keepalive?: boolean;
};

export async function api<T = void>(
  url: string,
  { method = "GET", body, errorMessage, keepalive }: ApiOptions,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      keepalive,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(`${errorMessage} Verifique sua conexão.`);
  }

  if (res.status === 401) {
    sessionExpired();
    throw new Error("Sua sessão expirou. Entre de novo para continuar.");
  }
  if (!res.ok) throw new Error(errorMessage);

  // 204 (sem corpo) e respostas vazias
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

