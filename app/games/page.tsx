'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/Sidebar'
import { StatusBadge, CompletionBar, Button, Modal, Select } from '@/components/ui'
import { GameForm } from '@/components/GameForm'
import { PLATFORMS, ACCOUNT_STATUSES, GAME_STATUSES, formatGameDate } from '@/lib/constants'
import { Pencil, Trash2, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

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
  const [filterGameStatus, setFilterGameStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('title')

  const { requireAuth } = useAuth()

  useEffect(() => { fetchGames() }, [])

  async function fetchGames() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/games')
      if (!res.ok) throw new Error('Failed to load games')
      setGames(await res.json())
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    let list = [...games]
    if (search) list = list.filter((g) => g.title.toLowerCase().includes(search.toLowerCase()))
    if (filterPlatform) list = list.filter((g) => g.platform === filterPlatform)
    if (filterStatus) list = list.filter((g) => g.account_status === filterStatus)
    if (filterPlatinum === 'yes') list = list.filter((g) => g.platinum)
    if (filterPlatinum === 'no') list = list.filter((g) => !g.platinum)
    if (filterGameStatus) list = list.filter((g) => g.game_status === filterGameStatus)
    list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'completion') return (b.completion ?? -1) - (a.completion ?? -1)
      if (sortBy === 'platform') return a.platform.localeCompare(b.platform)
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      return 0
    })
    return list
  }, [games, search, filterPlatform, filterStatus, filterPlatinum, filterGameStatus, sortBy])

  return (
    <div className="flex min-h-screen bg-[#080a0f]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader title="Games" />

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="hidden md:block font-display font-bold text-3xl text-zinc-100 mb-1">Games</h1>
                <p className="text-zinc-600 text-sm">{filtered.length} of {games.length} games</p>
              </div>
              <Button variant="primary" onClick={() => requireAuth(() => setAddOpen(true))}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add game</span>
              </Button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search games…"
                    className="w-full bg-[#0f1117] border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-violet-500/60 transition-colors"
                  />
                </div>
                <label className="justify-content height-[20px] flex items-center">Order:</label>
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-28 sm:w-36 border border-white/[0.06]">
                  <option value="title">A → Z</option>
                  <option value="date">Newest</option>
                  <option value="completion">Completion</option>
                  <option value="platform">Platform</option>
                </Select>
              </div>

              <div className="flex gap-2 flex-wrap p-4">
                <label className="justify-content height-[20px] flex items-center">Filters:</label>
                <Select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="flex-1 min-w-[120px] border border-white/[0.06]">
                  <option value="">All platforms</option>
                  {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                </Select>
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 min-w-[140px] border border-white/[0.06]">
                  <option value="">All statuses</option>
                  {ACCOUNT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </Select>
                <Select value={filterPlatinum} onChange={(e) => setFilterPlatinum(e.target.value)} className="flex-1 min-w-[120px] border border-white/[0.06]">
                  <option value="">Platinum: all</option>
                  <option value="yes">Platinum only</option>
                  <option value="no">No platinum</option>
                </Select>
                <Select value={filterGameStatus} onChange={(e) => setFilterGameStatus(e.target.value)} className="flex-1 min-w-[140px] border border-white/[0.06]">
                  <option value="">All game statuses</option>
                  {GAME_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </Select>
                {(filterPlatform || filterStatus || filterPlatinum || filterGameStatus) && (
                  <Button variant="ghost" size="sm" onClick={() => { setFilterPlatform(''); setFilterStatus(''); setFilterPlatinum(''); setFilterGameStatus('') }}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 text-zinc-600">Loading games…</div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <p className="text-red-400 text-sm">{error}</p>
                <Button variant="default" onClick={fetchGames}>Retry</Button>
              </div>
            ) : (
              <>
                <div className="hidden md:block bg-[#0f1117] border border-white/[0.06] rounded-xl overflow-hidden">
                  {filtered.length === 0 && (
                    <p className="px-6 py-16 text-center text-zinc-600 text-sm">No games found</p>
                  )}
                  {filtered.map((g, i) => {
                    const date = formatGameDate(g.date)
                    return (
                      <div
                        key={g.id}
                        className={`flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors group ${i !== 0 ? 'border-t border-white/[0.06]' : ''}`}
                      >
                        {/* Left: trophy + title + subtitle */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/games/${g.id}`}
                              className="font-semibold text-[15px] text-zinc-100 hover:text-violet-300 transition-colors leading-tight truncate"
                            >
                              {g.title}
                            </Link>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                            <span>{g.platform}</span>
                            {g.account_status && <><span className="text-zinc-600">·</span><StatusBadge status={g.account_status} /></>}
                            {date && <><span className="text-zinc-700">·</span><span>{date}</span></>}
                          </div>
                        </div>

                        {/* Right: game status + completion */}
                        <div className="flex items-center gap-4 shrink-0">
                          {g.platinum && <span className="text-sm leading-none">🏆</span>}
                          {g.game_status && (
                            <span className="text-xs text-zinc-400 bg-zinc-800/60 border border-white/[0.06] px-2.5 py-0.5 rounded-md whitespace-nowrap">
                              {g.game_status}
                            </span>
                          )}
                          <div className="w-36">
                            <CompletionBar value={g.completion} />
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => requireAuth(() => setEditGame(g))}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => requireAuth(() => setDeleteGame(g))}>
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="md:hidden bg-[#0f1117] border border-white/[0.06] rounded-xl overflow-hidden">
                  {filtered.length === 0 && (
                    <p className="text-center text-zinc-600 py-16 text-sm">No games found</p>
                  )}
                  {filtered.map((g, i) => {
                    const date = formatGameDate(g.date)
                    return (
                      <div key={g.id} className={`flex items-center gap-3 px-4 py-5 ${i !== 0 ? 'border-b border-white/[0.06]' : ''}`}>
                        {/* Left */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Link href={`/games/${g.id}`} className="font-semibold text-zinc-100 hover:text-violet-300 transition-colors leading-tight line-clamp-2">
                              {g.title}
                            </Link>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-xs text-zinc-500">
                            <span>{g.platform}</span>
                            {date && <><span className="text-zinc-700">·</span><span>{date}</span></>}
                            {g.account_status && <><span className="text-zinc-700">·</span><StatusBadge status={g.account_status} /></>}
                          </div>
                        </div>
                        {/* Right */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div>
                            {g.platinum && <span className="text-xs leading-none pr-2">🏆</span>}
                            {g.game_status && (
                            <span className="text-xs text-zinc-400 bg-zinc-800/60 border border-white/[0.06] px-2 py-0.5 rounded-md whitespace-nowrap">
                              {g.game_status}
                            </span>
                            )}
                          </div>
                          <div className="w-28">
                            <CompletionBar value={g.completion} />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => requireAuth(() => setEditGame(g))}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => requireAuth(() => setDeleteGame(g))}>
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
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
