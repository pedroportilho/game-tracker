"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/Sidebar";
import { Button, Modal, ProgressBar } from "@/components/ui";
import { formatPercent } from "@/lib/constants";
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
import { sessionExpired } from "@/lib/authClient";
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
        aria-label="Arraste para reordenar"
      >
        <GripVertical className={styles.iconXs} />
      </button>
      <button
        onClick={() => onToggle(entry)}
        disabled={saving}
        aria-pressed={entry.completed}
        aria-label={entry.completed ? "Desmarcar como concluído" : "Marcar como concluído"}
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
  const fraction = total === 0 ? 0 : done / total;
  const complete = total > 0 && done === total;

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
            {done} / {total} {done === 1 ? "concluído" : "concluídos"}
          </span>
        </span>

        <span className={styles.progress}>
          <span className={`${styles.pct} ${complete ? styles.pctDone : ""}`}>
            {formatPercent(fraction)}%
          </span>
          <ProgressBar value={fraction} showLabel={false} className="w-full" />
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
                  placeholder="Nome do jogo…"
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
                  {adding ? "…" : "Adicionar"}
                </button>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => {
                    setAddOpen(false);
                    setNewTitle("");
                  }}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className={styles.addLink}
              >
                <Plus className={styles.iconXs} /> Adicionar jogo
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
      if (res.status === 401) {
        sessionExpired();
        return;
      }
      if (!res.ok) throw new Error("Não foi possível carregar as séries.");
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
      const res = await fetch("/api/series/entry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, completed: !entry.completed }),
      });
      if (res.status === 401) sessionExpired();
      if (!res.ok) throw new Error("Não foi possível salvar.");
    } catch {
      fetchSeries();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEntry(seriesId, title) {
    const res = await fetch("/api/series/entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seriesId, title }),
    });
    if (res.status === 401) return sessionExpired();
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

      if (res.status === 401) sessionExpired();
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Não foi possível salvar a nova ordem.");
      }
    } catch (error) {
      console.error("Erro ao salvar a ordem:", error);
      fetchSeries();
    }
  }

  async function handleAddSeries() {
    if (!newSeriesName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSeriesName.trim() }),
      });
      if (res.status === 401) {
        setAddSeriesOpen(false);
        sessionExpired();
        return;
      }
      if (!res.ok) throw new Error("Não foi possível criar a série.");
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
  const overallPct = formatPercent(totalGames ? totalDone / totalGames : 0);

  return (
    <div className={styles.seriesPage}>
      <Sidebar />

      <div className={styles.main}>
        <MobileHeader title="Séries" />

        <main className={styles.content}>
          {/* ── Header ── */}
          <header className={styles.header}>
            <div className={styles.headerText}>
              <h1 className={styles.pageTitle}>Séries</h1>
              {!loading && !error && (
                <p className={styles.subtitle}>
                  {totalDone} de {totalGames} jogos concluídos em{" "}
                  {seriesList.length}{" "}
                  {seriesList.length === 1 ? "série" : "séries"}
                </p>
              )}
            </div>
            <Button
              variant="primary"
              onClick={() => setAddSeriesOpen(true)}
            >
              <Plus className={styles.iconSm} />
              <span className={styles.addLabel}>Nova série</span>
            </Button>
          </header>

          {/* ── Faixa de números ── */}
          {!loading && !error && (
            <section className={styles.kpiStrip}>
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>Séries</span>
                <span className={styles.kpiValue}>{seriesList.length}</span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>Jogos</span>
                <span className={styles.kpiValue}>{totalGames}</span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>Concluídos</span>
                <span className={`${styles.kpiValue} ${styles.kpiValueMint}`}>
                  {totalDone}
                </span>
                <span className={styles.kpiSub}>{overallPct}% no total</span>
              </div>
            </section>
          )}

          {/* ── Lista ── */}
          {loading ? (
            <div className={styles.state}>Carregando séries…</div>
          ) : error ? (
            <div className={styles.state}>
              <p className={styles.stateError}>{error}</p>
              <Button variant="default" onClick={fetchSeries}>
                Tentar de novo
              </Button>
            </div>
          ) : seriesList.length === 0 ? (
            <p className={styles.empty}>Nenhuma série ainda</p>
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
        title="Nova série"
      >
        <div className={styles.modalBody}>
          <input
            value={newSeriesName}
            onChange={(e) => setNewSeriesName(e.target.value)}
            placeholder="Nome da série…"
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
              Cancelar
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleAddSeries}
              disabled={saving || !newSeriesName.trim()}
            >
              {saving ? "Criando…" : "Criar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
