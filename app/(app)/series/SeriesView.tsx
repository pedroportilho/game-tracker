"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, GripVertical, Check } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Modal, ProgressBar } from "@/components/ui";
import { PageHeader, KpiStrip, Kpi } from "@/components/layout/Page";
import { showError } from "@/components/ui/Toaster";
import { formatPercent } from "@/lib/constants";
import { api, errorText } from "@/lib/api";
import type { Series, SeriesEntry } from "@/lib/seriesData";
import styles from "./series.module.css";

type ToggleEntry = (entry: SeriesEntry) => void;

// ─── Um jogo da série (arrastável) ───────────────────────────────────────────
function SortableEntry({
  entry,
  onToggle,
  saving,
}: {
  entry: SeriesEntry;
  onToggle: ToggleEntry;
  saving: boolean;
}) {
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

// ─── Uma série (linha expansível) ────────────────────────────────────────────
function SeriesItem({
  series,
  onToggle,
  onAddEntry,
  onReorderEntries,
  saving,
}: {
  series: Series;
  onToggle: ToggleEntry;
  /** true se o jogo foi adicionado */
  onAddEntry: (seriesId: number, title: string) => Promise<boolean>;
  /** true se a nova ordem foi salva */
  onReorderEntries: (entries: SeriesEntry[]) => Promise<boolean>;
  saving: boolean;
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

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const previous = entries;
    const oldIndex = entries.findIndex((e) => e.id === active.id);
    const newIndex = entries.findIndex((e) => e.id === over.id);
    const newOrder = arrayMove(entries, oldIndex, newIndex);

    setEntries(newOrder);
    if (!(await onReorderEntries(newOrder))) setEntries(previous);
  }

  async function handleAddEntry() {
    if (!newTitle.trim() || adding) return;
    setAdding(true);
    const ok = await onAddEntry(series.id, newTitle.trim());
    setAdding(false);
    // Se falhou, o texto fica no campo para tentar de novo
    if (ok) {
      setNewTitle("");
      setAddOpen(false);
    }
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
          <ProgressBar value={fraction} showLabel={false} />
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
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddEntry}
                  disabled={adding || !newTitle.trim()}
                >
                  {adding ? "Adicionando…" : "Adicionar"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAddOpen(false);
                    setNewTitle("");
                  }}
                >
                  Cancelar
                </Button>
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

// ─── Página ──────────────────────────────────────────────────────────────────
// Parte interativa da página de séries. Os dados chegam prontos do servidor
// (page.tsx). Marcar e reordenar aparecem na hora e são desfeitos se a
// gravação falhar; depois de criar série/jogo, router.refresh() pede ao
// servidor a lista atualizada, que chega de novo por initialSeries.
export function SeriesView({ initialSeries }: { initialSeries: Series[] }) {
  const router = useRouter();
  const [seriesList, setSeriesList] = useState<Series[]>(initialSeries);
  const [saving, setSaving] = useState(false);
  const [addSeriesOpen, setAddSeriesOpen] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState("");

  useEffect(() => {
    setSeriesList(initialSeries);
  }, [initialSeries]);

  function setCompleted(entryId: number, completed: boolean) {
    setSeriesList((prev) =>
      prev.map((s) => ({
        ...s,
        entries: s.entries.map((e) =>
          e.id === entryId ? { ...e, completed } : e,
        ),
      })),
    );
  }

  async function handleToggle(entry: SeriesEntry) {
    const completed = !entry.completed;
    setCompleted(entry.id, completed);
    setSaving(true);
    try {
      await api("/api/series/entry", {
        method: "PATCH",
        body: { id: entry.id, completed },
        errorMessage: "Não foi possível salvar — a alteração foi desfeita.",
      });
    } catch (e) {
      setCompleted(entry.id, entry.completed);
      showError(errorText(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEntry(seriesId: number, title: string) {
    try {
      await api("/api/series/entry", {
        method: "POST",
        body: { seriesId, title },
        errorMessage: "Não foi possível adicionar o jogo.",
      });
      router.refresh();
      return true;
    } catch (e) {
      showError(errorText(e));
      return false;
    }
  }

  async function handleReorderEntries(newOrder: SeriesEntry[]) {
    try {
      await api("/api/series/entry/reorder", {
        method: "PATCH",
        body: {
          entries: newOrder.map((e, index) => ({ id: e.id, position: index + 1 })),
        },
        errorMessage: "Não foi possível salvar a nova ordem — ela foi desfeita.",
      });
      return true;
    } catch (e) {
      showError(errorText(e));
      return false;
    }
  }

  async function handleAddSeries() {
    if (!newSeriesName.trim() || saving) return;
    setSaving(true);
    try {
      await api("/api/series", {
        method: "POST",
        body: { name: newSeriesName.trim() },
        errorMessage: "Não foi possível criar a série.",
      });
      setNewSeriesName("");
      setAddSeriesOpen(false);
      router.refresh();
    } catch (e) {
      showError(errorText(e));
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
    <>
      <PageHeader
        title="Séries"
        subtitle={`${totalDone} de ${totalGames} jogos concluídos em ${seriesList.length} ${seriesList.length === 1 ? "série" : "séries"}`}
        actions={
          <Button variant="primary" onClick={() => setAddSeriesOpen(true)}>
            <Plus className={styles.iconSm} />
            <span className={styles.addLabel}>Nova série</span>
          </Button>
        }
      />

      <KpiStrip>
        <Kpi label="Séries" value={seriesList.length} />
        <Kpi label="Jogos" value={totalGames} />
        <Kpi
          label="Concluídos"
          value={totalDone}
          sub={`${overallPct}% no total`}
          tone="mint"
        />
      </KpiStrip>

      {/* ── Lista ── */}
      {seriesList.length === 0 ? (
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
            <Button
              variant="ghost"
              onClick={() => setAddSeriesOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleAddSeries}
              disabled={saving || !newSeriesName.trim()}
            >
              {saving ? "Criando…" : "Criar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
