'use client'

import { useState } from 'react'
import { Input, Select, Button } from '@/components/ui'
import { PLATFORMS, ACCOUNT_STATUSES, GENRES } from '@/lib/constants'

const EMPTY = {
  title: '', platform: '', date: '', platinum: false,
  completion: '', accountStatus: 'Preserved', genres: [], notes: '',
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

export function GameForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          ...initialData,
          completion: initialData.completion != null ? Math.round(initialData.completion * 100) : '',
          genres: Array.isArray(initialData.genres) ? initialData.genres : [],
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
      <Input label="Title" value={form.title} onChange={(e) => set('title', e.target.value)}
        error={errors.title} placeholder="Game title" />

      <div className="grid grid-cols-2 gap-3">
        <Select label="Platform" value={form.platform} onChange={(e) => set('platform', e.target.value)} error={errors.platform}>
          <option value="">Select…</option>
          {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
        </Select>
        <Input label="Year" type="number" value={form.date} onChange={(e) => set('date', e.target.value)}
          placeholder="e.g. 2024" min="1970" max="2030" />
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
