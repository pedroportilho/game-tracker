"use client";

import { useRef, useState } from "react";
import {
  gameCompletion,
  sectionCompletion,
  sectionTotals,
  stateLabel,
  toMatrix,
  valueOf,
  type ChecklistGame,
  type ChecklistItem,
  type ChecklistSection,
  type Progress,
} from "@/lib/checklists";
import { api, errorText } from "@/lib/api";
import { ProgressBar } from "@/components/ui";
import { formatPercent } from "@/lib/constants";
import { showError } from "@/components/ui/Toaster";
import styles from "../checklists.module.css";

type Props = {
  game: ChecklistGame;
  initialProgress: Progress;
};

/** Próximo valor ao clicar no item: check alterna, tier cicla, count soma 1. */
function nextValue(item: ChecklistItem, value: number): number {
  if (item.kind === "check") return value ? 0 : 1;
  if (item.kind === "tier") return value >= item.max_value ? 0 : value + 1;
  return Math.min(value + 1, item.max_value);
}

export function ChecklistView({ game, initialProgress }: Props) {
  const [progress, setProgress] = useState<Progress>(initialProgress);

  // Fila de gravação por item. Antes cada clique disparava um PATCH em
  // paralelo; com cliques rápidos (ex.: "+" várias vezes) as requisições
  // chegavam ao banco fora de ordem e um valor antigo sobrescrevia o novo.
  // Agora há no máximo uma requisição por item em voo; cliques durante ela só
  // atualizam o valor desejado, que é enviado assim que a anterior termina.
  const confirmed = useRef<Progress>({ ...initialProgress }); // último valor salvo
  const pending = useRef(new Map<string, number>()); // valor ainda não enviado
  const sending = useRef(new Set<string>()); // itens com requisição em voo

  async function flush(itemId: string) {
    if (sending.current.has(itemId)) return; // o laço em andamento envia
    sending.current.add(itemId);

    try {
      while (pending.current.has(itemId)) {
        const value = pending.current.get(itemId)!;
        pending.current.delete(itemId);

        await api("/api/checklists/progress", {
          method: "PATCH",
          body: { itemId, value },
          keepalive: true, // não perde o último clique se a aba fechar
          errorMessage: "Não foi possível salvar — a alteração foi desfeita.",
        });
        confirmed.current[itemId] = value;
      }
    } catch (e) {
      // Volta ao último valor que o servidor realmente gravou.
      pending.current.delete(itemId);
      setProgress((p) => ({ ...p, [itemId]: confirmed.current[itemId] ?? 0 }));
      showError(errorText(e));
    } finally {
      sending.current.delete(itemId);
    }
  }

  // Atualiza na hora e agenda a gravação no servidor.
  function setValue(item: ChecklistItem, value: number) {
    const next = Math.max(0, Math.min(value, item.max_value));
    if (next === valueOf(progress, item)) return;

    setProgress((p) => ({ ...p, [item.id]: next }));
    pending.current.set(item.id, next);
    void flush(item.id);
  }

  const overall = gameCompletion(game, progress);

  return (
    <>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Checklist</p>
          {/* A lista de checklists já destaca os logos; aqui o nome completo */}
          <h1 className={styles.title}>{game.name}</h1>
        </div>

        <div className={styles.heroStat}>
          <span
            className={`${styles.heroPct} ${overall >= 1 ? styles.heroPctDone : ""}`}
          >
            {formatPercent(overall)}%
          </span>
          <ProgressBar value={overall} showLabel={false} />
        </div>
      </header>

      <div className={styles.sections}>
        {game.sections.map((section) => (
          <Section
            key={section.id}
            section={section}
            progress={progress}
            onSet={setValue}
          />
        ))}
      </div>
    </>
  );
}

// ─── Seção ───────────────────────────────────────────────────────────────────
function Section({
  section,
  progress,
  onSet,
}: {
  section: ChecklistSection;
  progress: Progress;
  onSet: (item: ChecklistItem, value: number) => void;
}) {
  const { got, total } = sectionTotals(section, progress);
  const c = sectionCompletion(section, progress);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionName}>{section.name}</h2>
        <span className={styles.sectionCount}>
          {got}/{total}
        </span>
        <span
          className={`${styles.sectionPct} ${c >= 1 ? styles.sectionPctDone : ""}`}
        >
          {formatPercent(c)}%
        </span>
      </div>

      {section.layout === "matrix" ? (
        <Matrix section={section} progress={progress} onSet={onSet} />
      ) : section.layout === "list" ? (
        <ul className={styles.list}>
          {section.items.map((item) => (
            <li key={item.id}>
              <ListRow item={item} progress={progress} onSet={onSet} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className={styles.grid}>
          {section.items.map((item) => (
            <li key={item.id}>
              <Tile item={item} progress={progress} onSet={onSet} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type ItemProps = {
  item: ChecklistItem;
  progress: Progress;
  onSet: (item: ChecklistItem, value: number) => void;
};

// ─── Grid: ícone que acende ──────────────────────────────────────────────────
function Tile({ item, progress, onSet }: ItemProps) {
  const value = valueOf(progress, item);
  const on = value > 0;
  const done = value >= item.max_value;
  const state = stateLabel(item, value);

  return (
    <div
      className={`${styles.tile} ${on ? styles.tileOn : ""} ${done ? styles.tileDone : ""}`}
    >
      <button
        type="button"
        className={styles.tileBtn}
        onClick={() => onSet(item, nextValue(item, value))}
        aria-pressed={on}
        aria-label={item.label}
        title={item.label}
      >
        {item.image ? (
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className={styles.tileImg}
            draggable={false}
          />
        ) : (
          <span className={styles.tileFallback}>{item.label.slice(0, 2)}</span>
        )}
      </button>

      <span className={styles.tileLabel}>{item.label}</span>

      {item.kind === "tier" && item.max_value <= 4 && (
        <>
          <span className={styles.tileState}>{state}</span>
          <span className={styles.pips}>
            {Array.from({ length: item.max_value }, (_, i) => i + 1).map(
              (level) => (
                <button
                  key={level}
                  type="button"
                  className={`${styles.pip} ${level <= value ? styles.pipOn : ""}`}
                  onClick={() => onSet(item, level === value ? level - 1 : level)}
                  aria-label={`${item.label}: ${item.tiers?.[level - 1] ?? level}`}
                  title={item.tiers?.[level - 1]}
                />
              ),
            )}
          </span>
        </>
      )}

      {(item.kind === "count" || (item.kind === "tier" && item.max_value > 4)) && (
        <span className={styles.stepper}>
          <button
            type="button"
            className={styles.step}
            onClick={() => onSet(item, value - 1)}
            disabled={value === 0}
            aria-label={`Remover um: ${item.label}`}
          >
            −
          </button>
          <span className={styles.tileState}>{state ?? "—"}</span>
          <button
            type="button"
            className={styles.step}
            onClick={() => onSet(item, value + 1)}
            disabled={done}
            aria-label={`Adicionar um: ${item.label}`}
          >
            +
          </button>
        </span>
      )}
    </div>
  );
}

// ─── List: linhas de texto ───────────────────────────────────────────────────
function ListRow({ item, progress, onSet }: ItemProps) {
  const value = valueOf(progress, item);
  const on = value > 0;
  const state = item.kind === "check" ? null : stateLabel(item, value);

  return (
    <button
      type="button"
      className={`${styles.listRow} ${on ? styles.listRowOn : ""}`}
      onClick={() => onSet(item, nextValue(item, value))}
      aria-pressed={on}
    >
      {item.image ? (
        <img src={item.image} alt="" loading="lazy" className={styles.listImg} />
      ) : (
        <span className={`${styles.dot} ${on ? styles.dotOn : ""}`} />
      )}
      <span>{item.label}</span>
      {state && <span className={styles.listState}>{state}</span>}
    </button>
  );
}

// ─── Matrix: linhas × colunas (dungeons) ─────────────────────────────────────
function Matrix({
  section,
  progress,
  onSet,
}: {
  section: ChecklistSection;
  progress: Progress;
  onSet: (item: ChecklistItem, value: number) => void;
}) {
  const { columns, rows } = toMatrix(section);

  return (
    <div className={styles.matrixWrap}>
      <table className={styles.matrix}>
        <thead>
          <tr>
            <th />
            {columns.map((col) => (
              <th key={col.label} className={styles.matrixCol}>
                {col.image && (
                  <img
                    src={col.image}
                    alt=""
                    loading="lazy"
                    className={styles.matrixColImg}
                  />
                )}
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.group}>
              <th scope="row" className={styles.matrixRow}>
                {row.group}
              </th>
              {row.cells.map((item, i) => {
                if (!item) {
                  return (
                    <td key={columns[i].label} className={styles.cellNa}>
                      —
                    </td>
                  );
                }
                const on = valueOf(progress, item) > 0;
                return (
                  <td key={item.id}>
                    <button
                      type="button"
                      className={`${styles.cellBtn} ${on ? styles.cellOn : ""}`}
                      onClick={() => onSet(item, on ? 0 : 1)}
                      aria-pressed={on}
                      aria-label={`${row.group} — ${item.label}`}
                      title={`${row.group} — ${item.label}`}
                    >
                      {item.image ? (
                        <img src={item.image} alt="" draggable={false} />
                      ) : (
                        <span className={`${styles.dot} ${on ? styles.dotOn : ""}`} />
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
