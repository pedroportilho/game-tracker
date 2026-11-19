"use client";

import { useRef, useState } from "react";
import {
  formatPct,
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
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const inFlight = useRef(0);

  // Atualiza na hora e confirma no servidor; se falhar, volta ao valor anterior.
  async function setValue(item: ChecklistItem, value: number) {
    const previous = valueOf(progress, item);
    const next = Math.max(0, Math.min(value, item.max_value));
    if (next === previous) return;

    setProgress((p) => ({ ...p, [item.id]: next }));
    inFlight.current += 1;
    setStatus("saving");

    try {
      const res = await fetch("/api/checklists/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, value: next }),
      });
      if (!res.ok) throw new Error("save failed");
      inFlight.current -= 1;
      if (inFlight.current === 0) setStatus("idle");
    } catch {
      inFlight.current -= 1;
      setProgress((p) => ({ ...p, [item.id]: previous }));
      setStatus("error");
    }
  }

  const overall = gameCompletion(game, progress);

  return (
    <>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Checklist</p>
          {game.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.logo} alt={game.name} className={styles.heroLogo} />
          ) : (
            <h1 className={styles.title}>{game.name}</h1>
          )}
        </div>

        <div className={styles.heroStat}>
          <span
            className={`${styles.heroPct} ${overall >= 1 ? styles.heroPctDone : ""}`}
          >
            {formatPct(overall)}%
          </span>
          <span className={styles.bar}>
            <span
              className={`${styles.barFill} ${overall >= 1 ? styles.barFillDone : ""}`}
              style={{ width: `${overall * 100}%` }}
            />
          </span>
          <p
            className={`${styles.statusLine} ${status === "error" ? styles.statusError : ""}`}
            role="status"
          >
            {status === "saving" && "Saving…"}
            {status === "error" && "Couldn’t save — change reverted."}
          </p>
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
          {formatPct(c)}%
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
          // eslint-disable-next-line @next/next/no-img-element
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
            aria-label={`Remove one ${item.label}`}
          >
            −
          </button>
          <span className={styles.tileState}>{state ?? "—"}</span>
          <button
            type="button"
            className={styles.step}
            onClick={() => onSet(item, value + 1)}
            disabled={done}
            aria-label={`Add one ${item.label}`}
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
        // eslint-disable-next-line @next/next/no-img-element
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
                  // eslint-disable-next-line @next/next/no-img-element
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
                        // eslint-disable-next-line @next/next/no-img-element
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
