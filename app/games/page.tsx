"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/Sidebar";
import {
  StatusBadge,
  CompletionBar,
  Button,
  Modal,
  Select,
} from "@/components/ui";
import { GameForm } from "@/components/GameForm";
import {
  PLATFORMS,
  ACCOUNT_STATUSES,
  GAME_STATUSES,
  formatGameDate,
} from "@/lib/constants";
import { Pencil, Trash2, Plus, Search, Trophy } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import styles from "./games.module.css";

// Cor do ponto de cada status (mesmas cores da rosca do dashboard)
const STATUS_TONE: Record<string, string> = {
  Completed: styles.sCompleted,
  Backlog: styles.sBacklog,
  "On Hold": styles.sOnHold,
  Playing: styles.sPlaying,
  Dropped: styles.sDropped,
};

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editGame, setEditGame] = useState(null);
  const [deleteGame, setDeleteGame] = useState(null);

  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPlatinum, setFilterPlatinum] = useState("");
  const [filterGameStatus, setFilterGameStatus] = useState("");
  const [sortBy, setSortBy] = useState("title");

  const { requireAuth } = useAuth();

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/games");
      if (!res.ok) throw new Error("Failed to load games");
      setGames(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(data) {
    setSaving(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add game");
      const newGame = await res.json();
      setGames((g) => [...g, newGame]);
      setAddOpen(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(data) {
    setSaving(true);
    try {
      const res = await fetch(`/api/games/${editGame.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update game");
      const updated = await res.json();
      setGames((g) => g.map((x) => (x.id === updated.id ? updated : x)));
      setEditGame(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      const res = await fetch(`/api/games/${deleteGame.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete game");
      setGames((g) => g.filter((x) => x.id !== deleteGame.id));
      setDeleteGame(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    let list = [...games];
    if (search)
      list = list.filter((g) =>
        g.title.toLowerCase().includes(search.toLowerCase()),
      );
    if (filterPlatform)
      list = list.filter((g) => g.platform === filterPlatform);
    if (filterStatus)
      list = list.filter((g) => g.account_status === filterStatus);
    if (filterPlatinum === "yes") list = list.filter((g) => g.platinum);
    if (filterPlatinum === "no") list = list.filter((g) => !g.platinum);
    if (filterGameStatus)
      list = list.filter((g) => g.game_status === filterGameStatus);
    list.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "completion")
        return (b.completion ?? -1) - (a.completion ?? -1);
      if (sortBy === "platform") return a.platform.localeCompare(b.platform);
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return 0;
    });
    return list;
  }, [
    games,
    search,
    filterPlatform,
    filterStatus,
    filterPlatinum,
    filterGameStatus,
    sortBy,
  ]);

  const hasActiveFilters =
    filterPlatform || filterStatus || filterPlatinum || filterGameStatus;

  return (
    <div className={styles.gamesPage}>
      <Sidebar />

      <div className={styles.main}>
        <MobileHeader title="Games" />

        <main className={styles.content}>
          {/* ── Header ── */}
          <header className={styles.header}>
            <div className={styles.headerText}>
              <h1 className={styles.pageTitle}>Games</h1>
              <p className={styles.subtitle}>
                {filtered.length} of {games.length} games
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => requireAuth(() => setAddOpen(true))}
            >
              <Plus className={styles.iconSm} />
              <span className={styles.addLabel}>Add game</span>
            </Button>
          </header>

          {/* ── Busca + filtros ── */}
          <section className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search className={styles.searchIcon} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search games…"
                className={styles.search}
              />
            </div>

            <div className={styles.controls}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Platform</span>
                <Select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                >
                  <option value="">All</option>
                  {PLATFORMS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </Select>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Account status</span>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All</option>
                  {ACCOUNT_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Platinum</span>
                <Select
                  value={filterPlatinum}
                  onChange={(e) => setFilterPlatinum(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="yes">Platinum</option>
                  <option value="no">No Platinum</option>
                </Select>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Game status</span>
                <Select
                  value={filterGameStatus}
                  onChange={(e) => setFilterGameStatus(e.target.value)}
                >
                  <option value="">All</option>
                  {GAME_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Order</span>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="title">A → Z</option>
                  <option value="date">Newest</option>
                  <option value="completion">Completion</option>
                  <option value="platform">Platform</option>
                </Select>
              </label>

              {hasActiveFilters && (
                <button
                  type="button"
                  className={styles.clear}
                  onClick={() => {
                    setFilterPlatform("");
                    setFilterStatus("");
                    setFilterPlatinum("");
                    setFilterGameStatus("");
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </section>

          {/* ── Lista ── */}
          {loading ? (
            <div className={styles.state}>Loading games…</div>
          ) : error ? (
            <div className={styles.state}>
              <p className={styles.stateError}>{error}</p>
              <Button variant="default" onClick={fetchGames}>
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className={styles.empty}>No games found</p>
          ) : (
            <ul className={styles.list}>
              {filtered.map((g) => {
                const date = formatGameDate(g.date);

                return (
                  <li key={g.id} className={styles.row}>
                    {/* Título e informações */}
                    <div className={styles.rowMain}>
                      <Link href={`/games/${g.id}`} className={styles.title}>
                        {g.title}
                      </Link>

                      <div className={styles.meta}>
                        <span>{g.platform}</span>

                        {g.account_status && (
                          <>
                            <span className={styles.sep}>·</span>
                            <StatusBadge status={g.account_status} />
                          </>
                        )}

                        {date && (
                          <>
                            <span className={styles.sep}>·</span>
                            <span>{date}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status do jogo + completion */}
                    <div className={styles.rowSide}>
                      <div className={styles.rowStatus}>
                        {g.platinum && (
                          <Trophy
                            className={styles.trophy}
                            aria-label="Platinum"
                          />
                        )}
                        {g.game_status && (
                          <span
                            className={`${styles.status} ${
                              STATUS_TONE[g.game_status] ?? ""
                            }`}
                          >
                            <span className={styles.statusDot} />
                            {g.game_status}
                          </span>
                        )}
                      </div>

                      <div className={styles.rowBar}>
                        <CompletionBar value={g.completion} />
                      </div>
                    </div>

                    {/* Ações */}
                    <div className={styles.rowActions}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => requireAuth(() => setEditGame(g))}
                      >
                        <Pencil className={styles.iconXs} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => requireAuth(() => setDeleteGame(g))}
                      >
                        <Trash2
                          className={`${styles.iconXs} ${styles.iconDanger}`}
                        />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>

      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add game"
      >
        <GameForm
          onSubmit={handleAdd}
          onCancel={() => setAddOpen(false)}
          loading={saving}
        />
      </Modal>
      <Modal
        isOpen={!!editGame}
        onClose={() => setEditGame(null)}
        title="Edit game"
      >
        {editGame && (
          <GameForm
            initialData={editGame}
            onSubmit={handleEdit}
            onCancel={() => setEditGame(null)}
            loading={saving}
          />
        )}
      </Modal>
      <Modal
        isOpen={!!deleteGame}
        onClose={() => setDeleteGame(null)}
        title="Delete game"
      >
        {deleteGame && (
          <div className={styles.confirm}>
            <p className={styles.confirmText}>
              Are you sure you want to delete{" "}
              <span className={styles.confirmName}>{deleteGame.title}</span>?
              This cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <Button
                variant="ghost"
                onClick={() => setDeleteGame(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={saving}>
                {saving ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
