'use client'

import { STATUS_STYLES } from '@/lib/constants'

// ── Badge ────────────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700/30' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${s.bg} ${s.text} ${s.border}`}>
      {status}
    </span>
  )
}

// ── CompletionBar ─────────────────────────────────────────────────────────────
export function CompletionBar({ value, showLabel = true }) {
  if (value == null) return <span className="text-zinc-700 text-xs">—</span>
  const pct = Math.round(parseFloat(value) * 100)
  const color =
    pct === 100 ? 'bg-violet-500' :
    pct >= 75   ? 'bg-emerald-500' :
    pct >= 50   ? 'bg-amber-500' :
                  'bg-zinc-600'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-zinc-800 rounded-full min-w-[40px]">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="text-xs text-zinc-500 tabular-nums w-7 text-right">{pct}%</span>}
    </div>
  )
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, onClick, variant = 'default', size = 'md', type = 'button', disabled = false, className = '' }) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', icon: 'p-2' }
  const variants = {
    default: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60',
    primary: 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30',
    ghost: 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200',
    danger: 'bg-red-900/30 hover:bg-red-800/50 text-red-400 border border-red-800/30',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{label}</label>}
      <input
        {...props}
        className={`bg-[#0f1117] border ${error ? 'border-red-600/60' : 'border-white/8'} rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-violet-500/60 transition-colors ${className}`}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

// ── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{label}</label>}
      <select
        {...props}
        className={`bg-[#0f1117] border ${error ? 'border-red-600/60' : 'border-white/8'} rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/60 transition-colors appearance-none cursor-pointer ${className}`}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-[#0f1117] border border-white/8 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/6">
          <h2 className="font-display font-bold text-base text-zinc-100">{title}</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className={`rounded-xl p-5 border ${accent ? 'bg-violet-950/20 border-violet-700/20' : 'bg-[#0f1117] border-white/6'}`}>
      <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-semibold mb-2">{label}</p>
      <p className={`text-3xl font-display font-bold ${accent ? 'text-violet-300' : 'text-zinc-100'}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}
