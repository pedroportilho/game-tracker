'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/Sidebar'
import { StatusBadge, CompletionBar, Button, Modal, Select } from '@/components/ui'
import { GameForm } from '@/components/GameForm'
import { PLATFORMS, ACCOUNT_STATUSES, formatGameDate } from '@/lib/constants'
import { Pencil, Trash2, Plus, Search, SlidersHorizontal } from 'lucide-react'

export default function GamesPage() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [addOpen, setAddOpen] = useState(false)
  const [editGame, setEditGame] = useState(null)
  const [deleteGame, setDeleteGame] = useState(null)

  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPlatinum, setFilterPlatinum] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('title')

  useEffect(() => { fetchGames() }, [])

  async function fetchGames() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/games')
      if (!res.ok) throw new Error('Failed to load games')
      setGames(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(data) {
    setSaving(true)
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add game')
      const newGame = await res.json()
      setGames((g) => [...g, newGame])
      setAddOpen(false)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(data) {
    setSaving(true)
    try {
      const res = await fetch(`/api/games/${editGame.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update game')
      const updated = await res.json()
      setGames((g) => g.map((x) => (x.id === updated.id ? updated : x)))
      setEditGame(null)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      const res = await fetch(`/api/games/${deleteGame.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete game')
      setGames((g) => g.filter((x) => x.id !== deleteGame.id))
      setDeleteGame(null)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    let list = [...games]
    if (search) list = list.filter((g) => g.title.toLowerCase().includes(search.toLowerCase()))
    if (filterPlatform) list = list.filter((g) => g.platform === filterPlatform)
    if (filterStatus) list = list.filter((g) => g.accountStatus === filterStatus)
    if (filterPlatinum === 'yes') list = list.filter((g) => g.platinum)
    if (filterPlatinum === 'no') list = list.filter((g) => !g.platinum)
    list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'completion') return (b.completion ?? -1) - (a.completion ?? -1)
      if (sortBy === 'platform') return a.platform.localeCompare(b.platform)
      if (sortBy === 'date') {
        const ya = typeof a.date === 'number' ? serialToYear(a.date) : parseInt(a.date) || 0
        const yb = typeof b.date === 'number' ? serialToYear(b.date) : parseInt(b.date) || 0
        return yb - ya
      }
      return 0
    })
    return list
  }, [games, search, filterPlatform, filterStatus, filterPlatinum, sortBy])

  return (
    <div className="flex min-h-screen bg-[#080a0f]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile com hambúrguer */}
        <MobileHeader title="Games" />

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="hidden md:block font-display font-bold text-3xl text-zinc-100 mb-1">Games</h1>
                <p className="text-zinc-600 text-sm">{filtered.length} of {games.length} games</p>
              </div>
              <Button variant="primary" onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add game</span>
              </Button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search games…"
                    className="w-full bg-[#0f1117] border border-white/8 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-violet-500/60 transition-colors"
                  />
                </div>
                <Button variant="default" onClick={() => setShowFilters((v) => !v)}>
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-28 sm:w-36">
                  <option value="title">A → Z</option>
                  <option value="date">Newest</option>
                  <option value="completion">Completion</option>
                  <option value="platform">Platform</option>
                </Select>
              </div>

              {showFilters && (
                <div className="flex gap-2 flex-wrap p-4 bg-[#0f1117] border border-white/6 rounded-xl">
                  <Select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="flex-1 min-w-[120px]">
                    <option value="">All platforms</option>
                    {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                  </Select>
                  <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 min-w-[140px]">
                    <option value="">All statuses</option>
                    {ACCOUNT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </Select>
                  <Select value={filterPlatinum} onChange={(e) => setFilterPlatinum(e.target.value)} className="flex-1 min-w-[120px]">
                    <option value="">Platinum: all</option>
                    <option value="yes">Platinum only</option>
                    <option value="no">No platinum</option>
                  </Select>
                  {(filterPlatform || filterStatus || filterPlatinum) && (
                    <Button variant="ghost" size="sm" onClick={() => { setFilterPlatform(''); setFilterStatus(''); setFilterPlatinum('') }}>
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Conteúdo */}
            {loading ? (
              <div className="flex items-center justify-center h-64 text-zinc-600">Loading games…</div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <p className="text-red-400 text-sm">{error}</p>
                <Button variant="default" onClick={fetchGames}>Retry</Button>
              </div>
            ) : (
              <>
                {/* ── Tabela (md+) ── */}
                <div className="hidden md:block bg-[#0f1117] border border-white/6 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[11px] text-zinc-600 uppercase tracking-widest border-b border-white/6 bg-white/2">
                          <th className="px-4 py-3 w-8" />
                          <th className="text-left px-4 py-3 font-semibold">Game</th>
                          <th className="text-left px-4 py-3 font-semibold">Platform</th>
                          <th className="text-left px-4 py-3 font-semibold">Finished</th>
                          <th className="text-left px-4 py-3 font-semibold">Status</th>
                          <th className="text-left px-4 py-3 font-semibold w-40">Completion</th>
                          <th className="px-4 py-3 w-20" />
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((g) => {
                          const date = formatGameDate(g.date)
                          return (
                            <tr key={g.id} className="border-b border-white/4 hover:bg-white/2 transition-colors group">
                              <td className="px-4 py-3 text-center w-8">
                                {g.platinum && <span className="text-sm">🏆</span>}
                              </td>
                              <td className="px-4 py-3">
                                <Link href={`/games/${g.id}`} className="text-zinc-200 font-medium leading-tight hover:text-violet-300 transition-colors">
                                  {g.title}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-zinc-500">{g.platform}</td>
                              <td className="px-4 py-3 text-zinc-500 tabular-nums">{date ?? <span className="text-zinc-700">—</span>}</td>
                              <td className="px-4 py-3"><StatusBadge status={g.accountStatus} /></td>
                              <td className="px-4 py-3 w-40"><CompletionBar value={g.completion} /></td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                  <Button variant="ghost" size="icon" onClick={() => setEditGame(g)}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => setDeleteGame(g)}>
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {filtered.length === 0 && (
                          <tr><td colSpan={8} className="px-4 py-16 text-center text-zinc-600">No games found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Cards (mobile) ── */}
                <div className="md:hidden flex flex-col gap-2">
                  {filtered.length === 0 && (
                    <p className="text-center text-zinc-600 py-16">No games found</p>
                  )}
                  {filtered.map((g) => {
                    const date = formatGameDate(g.date)
                    return (
                      <div key={g.id} className="bg-[#0f1117] border border-white/6 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {g.platinum && <span className="text-xs">🏆</span>}
                              <Link href={`/games/${g.id}`} className="font-medium text-zinc-100 hover:text-violet-300 transition-colors leading-tight line-clamp-2">
                                {g.title}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              <span className="text-xs text-zinc-500">{g.platform}</span>
                              {date && <span className="text-xs text-zinc-600">· {date}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => setEditGame(g)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteGame(g)}>
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={g.accountStatus} />
                          <div className="flex-1">
                            <CompletionBar value={g.completion} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add game">
        <GameForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} loading={saving} />
      </Modal>
      <Modal isOpen={!!editGame} onClose={() => setEditGame(null)} title="Edit game">
        {editGame && <GameForm initialData={editGame} onSubmit={handleEdit} onCancel={() => setEditGame(null)} loading={saving} />}
      </Modal>
      <Modal isOpen={!!deleteGame} onClose={() => setDeleteGame(null)} title="Delete game">
        {deleteGame && (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-zinc-400">
              Are you sure you want to delete <span className="text-zinc-100 font-medium">{deleteGame.title}</span>? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setDeleteGame(null)} disabled={saving}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
