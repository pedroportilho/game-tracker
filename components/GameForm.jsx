'use client'

import { useState, useEffect, useRef } from 'react'
import { Input, Select, Button } from '@/components/ui'
import { PLATFORMS, ACCOUNT_STATUSES, GENRES } from '@/lib/constants'
import { Search, X } from 'lucide-react'

const EMPTY = {
  title: '', platform: '', date: '', platinum: false,
  completion: '', accountStatus: 'Preserved', genres: [], notes: '',
  igdbId: null,
}

// Converte "May 2024" → "2024-05-01" para popular o <input type="date">
function displayDateToInputValue(dateStr) {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/')
    return `${y}-${m}-${d}`
  }
  const d = new Date(`${dateStr} 01`)
  if (!isNaN(d)) return d.toISOString().slice(0, 10)
  return ''
}

function validate(form) {
  const e = {}
  if (!form.title.trim()) e.title = 'Required'
  if (!form.platform) e.platform = 'Required'
  if (!form.accountStatus) e.accountStatus = 'Required'
  if (form.genres.length === 0) e.genres = 'Select at least one'
  if (form.completion !== '' && (isNaN(form.completion) || form.completion < 0 || form.completion > 100))
    e.completion = '0–100'
  return e
}

// Map IGDB genre names → app GENRES list
function mapIgdbGenres(igdbGenres) {
  const set = new Set(GENRES.map((g) => g.toLowerCase()))
  const out = []
  for (const g of igdbGenres ?? []) {
    const name = typeof g === 'string' ? g : g?.name
    if (!name) continue
    if (set.has(name.toLowerCase())) {
      out.push(GENRES.find((x) => x.toLowerCase() === name.toLowerCase()))
    } else if (name.toLowerCase().includes('role-playing')) {
      out.push('RPG')
    }
  }
  return [...new Set(out)]
}

function IgdbSearch({ onPick, currentIgdbId, onClear }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    const isId = /^\d+$/.test(q)
    if (!isId && q.length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/igdb/search?q=${encodeURIComponent(q)}`)
        if (res.ok) setResults(await res.json())
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  useEffect(() => {
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">
        IGDB lookup {currentIgdbId && <span className="text-violet-400 normal-case ml-1">linked #{currentIgdbId}</span>}
      </p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search IGDB by name or paste an ID…"
          className="w-full bg-[#0f1117] border border-white/8 rounded-lg pl-9 pr-9 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-violet-500/60 transition-colors"
        />
        {currentIgdbId && (
          <button type="button" onClick={onClear} title="Unlink"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (() => {
        const q = query.trim()
        const isId = /^\d+$/.test(q)
        const shouldShow = results.length > 0 || loading || isId || q.length >= 2
        if (!shouldShow) return null
        return (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-[#0f1117] border border-white/8 rounded-lg shadow-2xl max-h-72 overflow-y-auto">
          {loading && <div className="px-3 py-2 text-xs text-zinc-600">Searching…</div>}
          {!loading && results.length === 0 && (q.length >= 2 || isId) && (
            <div className="px-3 py-2 text-xs text-zinc-600">{isId ? `No game with IGDB ID ${q}` : 'No results'}</div>
          )}
          {results.map((r) => (
            <button
              type="button"
              key={r.id}
              onClick={() => { onPick(r); setQuery(''); setResults([]); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-left transition-colors"
            >
              {r.cover ? (
                <img src={r.cover} alt="" className="w-8 h-10 object-cover rounded" />
              ) : (
                <div className="w-8 h-10 bg-zinc-800 rounded" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{r.name}</p>
                <p className="text-[11px] text-zinc-600">
                  {r.year ?? '—'}{r.platforms.length > 0 && ` · ${r.platforms.slice(0, 3).join(', ')}`}
                </p>
              </div>
            </button>
          ))}
        </div>
        )
      })()}
    </div>
  )
}

export function GameForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          ...initialData,
          date: displayDateToInputValue(initialData.date),
          completion: initialData.completion != null ? Math.round(initialData.completion * 100) : '',
          genres: Array.isArray(initialData.genres) ? initialData.genres : [],
          igdbId: initialData.igdbId ?? null,
        }
      : EMPTY
  )
  const [errors, setErrors] = useState({})

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const toggleGenre = (g) =>
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g],
    }))

  async function handlePickIgdb(result) {
    // Fetch full details only for genre mapping. NEVER touch `date` — it's the
    // user's completion date, not the game's release date.
    try {
      const res = await fetch(`/api/igdb/games/${result.id}`)
      const data = res.ok ? await res.json() : null
      setForm((f) => ({
        ...f,
        igdbId: String(result.id),
        title: data?.name ?? result.name ?? f.title,
        genres: data?.genres ? mapIgdbGenres(data.genres) : f.genres,
      }))
    } catch {
      setForm((f) => ({
        ...f,
        igdbId: String(result.id),
        title: result.name ?? f.title,
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSubmit({
      ...form,
      completion: form.completion !== '' ? Number(form.completion) / 100 : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <IgdbSearch
        onPick={handlePickIgdb}
        currentIgdbId={form.igdbId}
        onClear={() => set('igdbId', null)}
      />

      <Input label="Title" value={form.title} onChange={(e) => set('title', e.target.value)}
        error={errors.title} placeholder="Game title" />

      <div className="grid grid-cols-2 gap-3">
        <Select label="Platform" value={form.platform} onChange={(e) => set('platform', e.target.value)} error={errors.platform}>
          <option value="">Select…</option>
          {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
        </Select>
        <Input label="Date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select label="Account Status" value={form.accountStatus} onChange={(e) => set('accountStatus', e.target.value)} error={errors.accountStatus}>
          {ACCOUNT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Input label="Completion %" type="number" value={form.completion}
          onChange={(e) => set('completion', e.target.value)} error={errors.completion}
          placeholder="0–100" min="0" max="100" />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input type="checkbox" checked={form.platinum} onChange={(e) => set('platinum', e.target.checked)}
          className="w-4 h-4 accent-violet-500 rounded" />
        <span className="text-sm text-zinc-300">🏆 Platinum / 100%</span>
      </label>

      <div>
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
          Genres {errors.genres && <span className="text-red-400 normal-case ml-1">{errors.genres}</span>}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => (
            <button key={g} type="button" onClick={() => toggleGenre(g)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                form.genres.includes(g)
                  ? 'bg-violet-700/60 text-violet-200 border border-violet-500/40'
                  : 'bg-zinc-800/60 text-zinc-500 hover:bg-zinc-700/60 border border-transparent'
              }`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <Input label="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)}
        placeholder="Optional notes" />

      <div className="flex gap-2 pt-1 justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving…' : initialData ? 'Save changes' : 'Add game'}
        </Button>
      </div>
    </form>
  )
}
