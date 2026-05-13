'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button, Modal, Input } from '@/components/ui'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'

// ─── CircularProgress ─────────────────────────────────────────────────────────
function CircularProgress({ value }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <div className="relative flex-shrink-0 w-12 h-12">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#ffffff0f" strokeWidth="3" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke={value === 100 ? '#a78bfa' : '#6d28d9'}
          strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-300 tabular-nums">
        {value}%
      </span>
    </div>
  )
}

// ─── SeriesCard ───────────────────────────────────────────────────────────────
function SeriesCard({ series, onToggle, onAddEntry, saving }) {
  const [open, setOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const total = series.entries.length
  const done = series.entries.filter((e) => e.completed).length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  async function handleAddEntry() {
    if (!newTitle.trim()) return
    setAdding(true)
    await onAddEntry(series.colIndex, newTitle.trim())
    setNewTitle('')
    setAddOpen(false)
    setAdding(false)
  }

  return (
    <div className="bg-[#0f1117] border border-white/6 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-zinc-100 text-lg leading-tight truncate">
            {series.name}
          </h2>
          <p className="text-zinc-600 text-xs mt-0.5">{done} / {total} completed</p>
        </div>
        <CircularProgress value={pct} />
        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-1 p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/6 transition-colors flex-shrink-0"
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="mx-5 h-1 bg-white/4 rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct === 100
              ? 'linear-gradient(90deg, #a78bfa, #818cf8)'
              : 'linear-gradient(90deg, #6d28d9, #4f46e5)',
          }}
        />
      </div>

      {/* Expandable list */}
      {open && (
        <div className="border-t border-white/6">
          <ul className="divide-y divide-white/4">
            {series.entries.map((entry, i) => (
              <li
                key={i}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/2 transition-colors"
              >
                <button
                  onClick={() => onToggle(entry)}
                  disabled={saving}
                  className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    entry.completed
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-zinc-700 hover:border-violet-500'
                  }`}
                >
                  {entry.completed && (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className={`text-sm flex-1 transition-colors ${
                  entry.completed ? 'text-zinc-500 line-through decoration-zinc-600' : 'text-zinc-200'
                }`}>
                  {entry.title}
                </span>
              </li>
            ))}
          </ul>

          {/* Add game to series */}
          <div className="px-5 py-3 border-t border-white/4">
            {addOpen ? (
              <div className="flex gap-2">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Game title…"
                  className="flex-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddEntry()
                    if (e.key === 'Escape') { setAddOpen(false); setNewTitle('') }
                  }}
                  autoFocus
                />
                <Button variant="primary" size="sm" onClick={handleAddEntry} disabled={adding || !newTitle.trim()}>
                  {adding ? '…' : 'Add'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setAddOpen(false); setNewTitle('') }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-violet-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add game
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [addSeriesOpen, setAddSeriesOpen] = useState(false)
  const [newSeriesName, setNewSeriesName] = useState('')

  useEffect(() => { fetchSeries() }, [])

  async function fetchSeries() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/series')
      if (!res.ok) throw new Error('Failed to load series')
      setSeriesList(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(entry) {
    // Optimistic update
    setSeriesList((prev) =>
      prev.map((s) => ({
        ...s,
        entries: s.entries.map((e) =>
          e.rowIndex === entry.rowIndex && e.colIndex === entry.colIndex
            ? { ...e, completed: !e.completed }
            : e
        ),
      }))
    )
    setSaving(true)
    try {
      await fetch('/api/series/entry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: entry.rowIndex, colIndex: entry.colIndex, completed: !entry.completed }),
      })
    } catch {
      fetchSeries() // revert on error
    } finally {
      setSaving(false)
    }
  }

  async function handleAddEntry(colIndex, title) {
    await fetch('/api/series/entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', colIndex, title }),
    })
    fetchSeries()
  }

  async function handleAddSeries() {
    if (!newSeriesName.trim()) return
    setSaving(true)
    try {
      await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSeriesName.trim() }),
      })
      setNewSeriesName('')
      setAddSeriesOpen(false)
      fetchSeries()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const totalGames = seriesList.reduce((acc, s) => acc + s.entries.length, 0)
  const totalDone = seriesList.reduce((acc, s) => acc + s.entries.filter((e) => e.completed).length, 0)

  return (
    <div className="flex min-h-screen bg-[#080a0f]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display font-bold text-3xl text-zinc-100 mb-1">Series</h1>
              {!loading && !error && (
                <p className="text-zinc-600 text-sm">
                  {totalDone} of {totalGames} games completed across {seriesList.length} series
                </p>
              )}
            </div>
            <Button variant="primary" onClick={() => setAddSeriesOpen(true)}>
              <Plus className="w-4 h-4" /> New series
            </Button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64 text-zinc-600">Loading series…</div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <p className="text-red-400 text-sm">{error}</p>
              <Button variant="default" onClick={fetchSeries}>Retry</Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {seriesList.map((series, i) => (
                <SeriesCard
                  key={`${series.colIndex}-${i}-${series.name}`}
                  series={series}
                  onToggle={handleToggle}
                  onAddEntry={handleAddEntry}
                  saving={saving}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Series Modal */}
      <Modal isOpen={addSeriesOpen} onClose={() => setAddSeriesOpen(false)} title="New series">
        <div className="flex flex-col gap-5">
          <Input
            value={newSeriesName}
            onChange={(e) => setNewSeriesName(e.target.value)}
            placeholder="Series name…"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSeries() }}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setAddSeriesOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleAddSeries} disabled={saving || !newSeriesName.trim()}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
