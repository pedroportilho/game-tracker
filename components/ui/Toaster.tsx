"use client";

import { useEffect, useState } from "react";
import styles from "./ui.module.css";

// Avisos do site inteiro. Qualquer componente chama showError(...) ou
// showSuccess(...) e o <Toaster /> (montado uma vez no layout raiz) mostra o
// aviso no rodapé da tela por alguns segundos.

type Toast = { id: number; message: string; kind: "error" | "success" };

const DURATION_MS = 6000;
let nextId = 1;
const listeners = new Set<(toast: Toast) => void>();

function show(message: string, kind: Toast["kind"]) {
  const toast = { id: nextId++, message, kind };
  listeners.forEach((listener) => listener(toast));
}

export const showError = (message: string) => show(message, "error");
export const showSuccess = (message: string) => show(message, "success");

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const add = (toast: Toast) => {
      // O mesmo erro repetido (ex.: vários cliques falhando) aparece uma vez só
      setToasts((list) =>
        list.some((t) => t.message === toast.message) ? list : [...list, toast],
      );
      setTimeout(() => dismiss(toast.id), DURATION_MS);
    };
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);

  function dismiss(id: number) {
    setToasts((list) => list.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toaster}>
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={`${styles.toast} ${t.kind === "success" ? styles.toastSuccess : ""}`}
        >
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Fechar aviso"
            title="Fechar"
            className={styles.close}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
