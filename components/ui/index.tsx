"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { ACCOUNT_STATUS_LABELS, labelFor, formatPercent } from "@/lib/constants";
import styles from "./ui.module.css";

/** Junta classes ignorando as vazias. */
function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── StatusBadge ──────────────────────────────────────────────────────────────
const BADGE_TONE: Record<string, string> = {
  Preserved: styles.badgePreserved,
  Lost: styles.badgeLost,
  "Re-earned": styles.badgeReearned,
  Unverified: styles.badgeUnverified,
};

export function StatusBadge({ status }: { status?: string }) {
  return (
    <span className={cx(styles.badge, BADGE_TONE[status ?? ""] ?? styles.badgeUnverified)}>
      {labelFor(ACCOUNT_STATUS_LABELS, status)}
    </span>
  );
}

// ── ProgressBar ──────────────────────────────────────────────────────────────
// A barra de progresso do site inteiro (jogos, recuperação, séries,
// checklists): trilho fino, roxo durante o progresso, verde quando completa.
// Só <span>s, para poder ficar dentro de <button> e <a>.
type ProgressBarProps = {
  /** 0..1; null/undefined mostra "—" */
  value?: number | null;
  /** mostra a porcentagem à direita da barra */
  showLabel?: boolean;
  className?: string;
};

export function ProgressBar({ value, showLabel = true, className }: ProgressBarProps) {
  if (value == null) return <span className={styles.progressEmpty}>—</span>;

  const v = Math.min(1, Math.max(0, value));
  const pct = formatPercent(v);

  return (
    <span className={cx(styles.progress, v >= 1 && styles.progressDone, className)}>
      <span
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v * 100)}
        aria-label={`${pct}%`}
        className={styles.progressTrack}
      >
        <span className={styles.progressFill} style={{ width: `${v * 100}%` }} />
      </span>
      {showLabel && <span className={styles.progressLabel}>{pct}%</span>}
    </span>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
// O único botão de ação do site. primary = ação principal; outline = ação
// secundária com contorno; ghost = discreto (cancelar, ícones); danger = excluir.
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({
  variant = "outline",
  size = "md",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.btn, styles[size], styles[variant], className)}
      {...props}
    />
  );
}

// ── Input / Select ───────────────────────────────────────────────────────────
type FieldProps = { label?: string; error?: string; children: ReactNode };

// Sem rótulo nem erro, devolve só o campo (para quem já tem o próprio <label>).
function Field({ label, error, children }: FieldProps) {
  if (!label && !error) return <>{children}</>;
  return (
    <label className={cx(styles.field, error && styles.hasError)}>
      {label && <span className={styles.label}>{label}</span>}
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <Field label={label} error={error}>
      <input {...props} className={cx(styles.control, className)} />
    </Field>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export function Select({ label, error, className, ...props }: SelectProps) {
  return (
    <Field label={label} error={error}>
      <select {...props} className={cx(styles.control, className)} />
    </Field>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.backdrop} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.dialogHead}>
          <h2 className={styles.dialogTitle}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className={styles.close}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.dialogBody}>{children}</div>
      </div>
    </div>
  );
}
