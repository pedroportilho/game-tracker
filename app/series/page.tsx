"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/Sidebar";
import { Button, Modal } from "@/components/ui";
import { ChevronDown, Plus, GripVertical, Check } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./series.module.css";

function SortableEntry({ entry, onToggle, saving }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  // O transform/transition do dnd-kit precisam ficar inline
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
    position: "relative" as const,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${styles.entry} ${isDragging ? styles.entryDragging : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className={styles.handle}
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVertical className={styles.iconXs} />
      </button>
      <button
        onClick={() => onToggle(entry)}
        disabled={saving}
        aria-pressed={entry.completed}
        aria-label={entry.completed ? "Mark as not completed" : "Mark as completed"}
        className={`${styles.check} ${entry.completed ? styles.checkOn : ""}`}
      >
        {entry.completed && <Check className={styles.checkIcon} strokeWidth={3.5} />}
      </button>
      <span
        className={`${styles.entryTitle} ${
          entry.completed ? styles.entryTitleDone : ""
        }`}
      >
        {entry.title}
      </span>
    </li>
  );
}

function SeriesItem({
  series,
  onToggle,
  onAddEntry,
  onReorderEntries,
  saving,
}) {
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [entries, setEntries] = useState(series.entries);

  useEffect(() => {
    setEntries(series.entries);
  }, [series.entries]);

  const total = entries.length;
  const done = entries.filter((e) => e.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = total > 0 && pct === 100;

  const sensors = useSensors(useSensor(PointerSensor));

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = entries.findIndex((e) => e.id === active.id);
    const newIndex = entries.findIndex((e) => e.id === over.id);
    const newOrder = arrayMove(entries, oldIndex, newIndex);

    setEntries(newOrder);
    await onReorderEntries(newOrder);
  }

  async function handleAddEntry() {
    if (!newTitle.trim()) return;
    setAdding(true);
    await onAddEntry(series.id, newTitle.trim());
    setNewTitle("");
    setAddOpen(false);
    setAdding(false);
  }

  return (
    <li className={styles.series}>
      {/* Cabeçalho: nome, progresso e seta (o botão inteiro abre/fecha) */}
      <button
        type="button"
        className={styles.seriesToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>
          <span className={styles.seriesName}>{series.name}</span>
          <span className={styles.seriesMeta}>
            {done} / {total} completed
          </span>
        </span>

        <span className={styles.progress}>
          <span className={`${styles.pct} ${complete ? styles.pctDone : ""}`}>
            {pct}%
          </span>
          <span className={styles.track}>
            <span
              className={`${styles.trackFill} ${
                complete ? styles.trackFillDone : ""
              }`}
              style={{ width: `${pct}%`, display: "block" }}
            />
          </span>
        </span>

        <ChevronDown
          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
        />
      </button>

      {open && (
        <div className={styles.entries}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={entries.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className={styles.entryList}>
                {entries.map((entry) => (
                  <SortableEntry
                    key={entry.id}
                    entry={entry}
                    onToggle={onToggle}
                    saving={saving}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          <div className={styles.addRow}>
            {addOpen ? (
              <>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Game title…"
                  className={`${styles.control} ${styles.addInput}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddEntry();
                    if (e.key === "Escape") {
                      setAddOpen(false);
                      setNewTitle("");
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleAddEntry}
                  disabled={adding || !newTitle.trim()}
                >
                  {adding ? "…" : "Add"}
                </button>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => {
                    setAddOpen(false);
                    setNewTitle("");
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className={styles.addLink}
              >
                <Plus className={styles.iconXs} /> Add game
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [addSeriesOpen, setAddSeriesOpen] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState("");

  useEffect(() => {
    fetchSeries();
  }, []);

  async function fetchSeries() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/series");
      if (!res.ok) throw new Error("Failed to load series");
      setSeriesList(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(entry) {
    setSeriesList((prev) =>
      prev.map((s) => ({
        ...s,
        entries: s.entries.map((e) =>
          e.id === entry.id ? { ...e, completed: !e.completed } : e,
        ),
      })),
    );
    setSaving(true);
    try {
      await fetch("/api/series/entry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, completed: !entry.completed }),
      });
    } catch {
      fetchSeries();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEntry(seriesId, title) {
    await fetch("/api/series/entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seriesId, title }),
    });
    fetchSeries();
  }

  async function handleReorderEntries(newOrder) {
    try {
      const res = await fetch("/api/series/entry/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: newOrder.map((e, index) => ({
            id: e.id,
            position: index + 1,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to reorder entries");
      }
    } catch (error) {
      console.error("Error saving order:", error);
      fetchSeries();
    }
  }

  async function handleAddSeries() {
    if (!newSeriesName.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSeriesName.trim() }),
      });
      setNewSeriesName("");
      setAddSeriesOpen(false);
      fetchSeries();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  const totalGames = seriesList.reduce((acc, s) => acc + s.entries.length, 0);
  const totalDone = seriesList.reduce(
    (acc, s) => acc + s.entries.filter((e) => e.completed).length,
    0,
  );
  const overallPct = totalGames ? Math.round((totalDone / totalGames) * 100) : 0;

  return (
    <div className={styles.seriesPage}>
      <Sidebar />

      <div className={styles.main}>
        <MobileHeader title="Series" />

        <main className={styles.content}>
          {/* ── Header ── */}
          <header className={styles.header}>
            <div className={styles.headerText}>
              <h1 className={styles.pageTitle}>Series</h1>
              {!loading && !error && (
                <p className={styles.subtitle}>
                  {totalDone} of {totalGames} games completed across{" "}
                  {seriesList.length} series
                </p>
              )}
            </div>
            <Button variant="primary" onClick={() => setAddSeriesOpen(true)}>
              <Plus className={styles.iconSm} />
              <span className={styles.addLabel}>New series</span>
            </Button>
          </header>

          {/* ── Faixa de números ── */}
          {!loading && !error && (
            <section className={styles.kpiStrip}>
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>Series</span>
                <span className={styles.kpiValue}>{seriesList.length}</span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>Games</span>
                <span className={styles.kpiValue}>{totalGames}</span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>Completed</span>
                <span className={`${styles.kpiValue} ${styles.kpiValueMint}`}>
                  {totalDone}
                </span>
                <span className={styles.kpiSub}>{overallPct}% overall</span>
              </div>
            </section>
          )}

          {/* ── Lista ── */}
          {loading ? (
            <div className={styles.state}>Loading series…</div>
          ) : error ? (
            <div className={styles.state}>
              <p className={styles.stateError}>{error}</p>
              <Button variant="default" onClick={fetchSeries}>
                Retry
              </Button>
            </div>
          ) : seriesList.length === 0 ? (
            <p className={styles.empty}>No series yet</p>
          ) : (
            <ul className={styles.seriesList}>
              {seriesList.map((series) => (
                <SeriesItem
                  key={series.id}
                  series={series}
                  onToggle={handleToggle}
                  onAddEntry={handleAddEntry}
                  onReorderEntries={handleReorderEntries}
                  saving={saving}
                />
              ))}
            </ul>
          )}
        </main>
      </div>

      <Modal
        isOpen={addSeriesOpen}
        onClose={() => setAddSeriesOpen(false)}
        title="New series"
      >
        <div className={styles.modalBody}>
          <input
            value={newSeriesName}
            onChange={(e) => setNewSeriesName(e.target.value)}
            placeholder="Series name…"
            className={styles.control}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddSeries();
            }}
            autoFocus
          />
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => setAddSeriesOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleAddSeries}
              disabled={saving || !newSeriesName.trim()}
            >
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
