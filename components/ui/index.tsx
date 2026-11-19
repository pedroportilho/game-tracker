"use client";

import {
  ReactNode,
  InputHTMLAttributes,
  SelectHTMLAttributes,
} from "react";
import {
  STATUS_STYLES,
  ACCOUNT_STATUS_LABELS,
  labelFor,
  formatPercent,
} from "@/lib/constants";

type StatusBadgeProps = { status?: string };
type ProgressBarProps = {
  /** 0..1; null/undefined mostra "—" */
  value?: number | null;
  /** mostra a porcentagem à direita da barra */
  showLabel?: boolean;
  className?: string;
};
type ButtonVariant = "default" | "primary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";
type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  title?: string;
  "aria-label"?: string;
};
type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  className?: string;
};
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

// ── Badge ────────────────────────────────────────────────────────────────────
export function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS_STYLES[status] ?? {
    bg: "bg-zinc-800",
    text: "text-zinc-400",
    border: "border-zinc-700/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${s.bg} ${s.text} ${s.border}`}
    >
      {labelFor(ACCOUNT_STATUS_LABELS, status)}
    </span>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
// A barra de progresso do site inteiro (jogos, recuperação, séries,
// checklists): trilho fino, roxo durante o progresso, verde quando completa.
// Só <span>s, para poder ficar dentro de <button> e <a>.
export function ProgressBar({
  value,
  showLabel = true,
  className = "",
}: ProgressBarProps) {
  if (value == null) {
    return <span className="text-zinc-700 text-xs">—</span>;
  }
  const v = Math.min(1, Math.max(0, value));
  const done = v >= 1;
  const pct = formatPercent(v);

  return (
    <span className={`flex items-center gap-3 min-w-0 ${className}`}>
      <span
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v * 100)}
        aria-label={`${pct}%`}
        className="block flex-1 min-w-[40px] h-1 rounded-full bg-white/[0.08] overflow-hidden"
      >
        <span
          className={`block h-full rounded-full transition-[width] duration-300 ${
            done ? "bg-emerald-400" : "bg-violet-500"
          }`}
          style={{ width: `${v * 100}%` }}
        />
      </span>
      {showLabel && (
        <span
          className={`w-12 shrink-0 text-right text-xs font-semibold tabular-nums ${
            done ? "text-emerald-400" : "text-zinc-400"
          }`}
        >
          {pct}%
        </span>
      )}
    </span>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Button({
  children,
  onClick,
  variant = "default",
  size = "md",
  type = "button",
  disabled = false,
  className = "",
  title,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const base =
    "inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    icon: "p-2",
  };
  const variants = {
    default:
      "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60",
    primary:
      "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30",
    ghost: "hover:bg-white/5 text-zinc-500 hover:text-zinc-200",
    danger:
      "bg-red-900/30 hover:bg-red-800/50 text-red-400 border border-red-800/30",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`bg-[#0f1117] border ${error ? "border-red-600/60" : "border-white/8"} rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-violet-500/60 transition-colors ${className}`}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────────────────
export function Select({
  label,
  error,
  children,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`bg-[#0f1117] border ${error ? "border-red-600/60" : "border-white/8"} rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/60 transition-colors appearance-none cursor-pointer ${className}`}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-[#0f1117] border border-white/8 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/6">
          <h2 className="font-display font-bold text-base text-zinc-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer p-1"
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
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
