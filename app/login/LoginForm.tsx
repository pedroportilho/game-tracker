"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { login, register, safeNext } from "@/lib/authClient";
import styles from "./login.module.css";

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
      className={styles.form}
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
        <div role="alert" className={styles.alert}>
          {error}
        </div>
      ) : null}

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          disabled={loading || !email || !password}
          className={styles.submit}
        >
          {loading ? "Enviando…" : isLogin ? "Entrar" : "Criar conta"}
        </Button>

        <button
          type="button"
          className={styles.switch}
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
