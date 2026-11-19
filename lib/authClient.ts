// lib/authClient.ts
// Ações de login no browser. Não há estado de "usuário logado" no cliente:
// o middleware só deixa abrir as páginas com sessão válida, então dentro do
// app o usuário está sempre logado. Se uma API responder 401 (sessão acabou
// no meio do uso), sessionExpired() leva para o login e depois de volta.

type AuthResult = { success: boolean; message?: string };

// O Supabase responde em inglês; traduz os erros mais comuns.
const AUTH_ERRORS: [string, string][] = [
  ["invalid login credentials", "E-mail ou senha incorretos."],
  ["email not confirmed", "Confirme seu e-mail antes de entrar."],
  ["already been registered", "Já existe uma conta com esse e-mail."],
  ["already registered", "Já existe uma conta com esse e-mail."],
  ["password should be at least", "A senha precisa ter pelo menos 6 caracteres."],
  ["invalid format", "E-mail inválido."],
  ["rate limit", "Muitas tentativas. Aguarde um pouco e tente de novo."],
  ["for security purposes", "Muitas tentativas. Aguarde um pouco e tente de novo."],
];

function translateAuthError(message: string | undefined, fallback: string) {
  if (!message) return fallback;
  const lower = message.toLowerCase();
  return AUTH_ERRORS.find(([en]) => lower.includes(en))?.[1] ?? fallback;
}

async function postAuth(
  mode: "login" | "register",
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, mode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: translateAuthError(
          data.error,
          mode === "login"
            ? "Não foi possível entrar. Tente novamente."
            : "Não foi possível criar a conta. Tente novamente.",
        ),
      };
    }
    return { success: true, message: data.message };
  } catch {
    return { success: false, message: "Erro de rede. Tente novamente." };
  }
}

export function login(email: string, password: string) {
  return postAuth("login", email, password);
}

/** Cria a conta e já entra nela (o cadastro sozinho não abre sessão). */
export async function register(email: string, password: string) {
  const created = await postAuth("register", email, password);
  if (!created.success) return created;
  return login(email, password);
}

/** Destino seguro depois do login: só caminhos internos (evita open redirect). */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard";
}

export async function logout() {
  await fetch("/api/auth", { method: "DELETE", credentials: "same-origin" });
  // Navegação completa: limpa o cache do router com dados da conta
  window.location.href = "/login";
}

/** Uma API respondeu 401: vai para o login e volta para esta página depois. */
export function sessionExpired() {
  const here = window.location.pathname + window.location.search;
  // reauth: o servidor recusou o token, então o middleware limpa os cookies
  window.location.href = `/login?reauth=1&next=${encodeURIComponent(here)}`;
}
