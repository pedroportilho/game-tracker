"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { login, register, safeNext } from "@/lib/authClient";

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit() {
    if (!email || !password || loading) return;
    setLoading(true);
    setError("");

    const result = isLogin
      ? await login(email, password)
      : await register(email, password);

    if (!result.success) {
      setLoading(false);
      setError(result.message ?? "Erro ao processar. Tente novamente.");
      return;
    }

    // Navegação completa para o middleware e as páginas verem a sessão nova
    window.location.href = safeNext(next);
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
        placeholder="seu@email.com"
        autoFocus
      />

      <Input
        label="Senha"
        type="password"
        autoComplete={isLogin ? "current-password" : "new-password"}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError("");
        }}
        placeholder="••••••••"
      />

      {error ? (
        <div
          role="alert"
          className="rounded-xl bg-red-950/60 border border-red-700/40 p-3 text-sm text-red-300"
        >
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="submit"
          variant="primary"
          disabled={loading || !email || !password}
          className="w-full sm:w-auto"
        >
          {loading ? "Enviando…" : isLogin ? "Entrar" : "Criar conta"}
        </Button>

        <button
          type="button"
          className="text-xs text-violet-300 hover:text-violet-100 transition"
          onClick={() => {
            setMode(isLogin ? "register" : "login");
            setError("");
          }}
        >
          {isLogin ? "Precisa criar uma conta?" : "Já tenho conta"}
        </button>
      </div>
    </form>
  );
}
