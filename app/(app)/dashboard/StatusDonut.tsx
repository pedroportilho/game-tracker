"use client";

import { useEffect, useRef } from "react";
import {
  GAME_STATUS_LABELS,
  formatPercent,
  labelFor,
} from "@/lib/constants";
import styles from "./dashboard.module.css";

type Buckets = {
  Dropped: number;
  "On Hold": number;
  Playing: number;
  Completed: number;
  Backlog: number;
};

interface StatusDonutProps {
  buckets: Buckets;
  total: number;
}

// As cores vêm do tema (globals.css). A legenda usa var() direto; o canvas
// do Chart.js não entende var(), então lê o valor já resolvido.
const STATUS_CONFIG = [
  { key: "Completed", color: "var(--status-completed)", token: "--mint" },
  { key: "Backlog", color: "var(--status-backlog)", token: "--blue" },
  { key: "On Hold", color: "var(--status-on-hold)", token: "--yellow" },
  { key: "Playing", color: "var(--status-playing)", token: "--pink" },
  { key: "Dropped", color: "var(--status-dropped)", token: "--dim" },
] as const;

/** Valor atual de um token do tema (ex.: "--mint" → "#34d399"). */
function themeColor(token: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

export function StatusDonut({ buckets, total }: StatusDonutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Keep a ref to the chart instance so we can destroy it on re-render
  const chartRef = useRef<import("chart.js").Chart | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { Chart, ArcElement, DoughnutController, Tooltip, Legend } =
        await import("chart.js");
      Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

      if (cancelled || !canvasRef.current) return;

      // Destroy previous instance if it exists (e.g. on hot reload)
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      chartRef.current = new Chart(canvasRef.current, {
        type: "doughnut",
        data: {
          labels: STATUS_CONFIG.map((s) => labelFor(GAME_STATUS_LABELS, s.key)),
          datasets: [
            {
              data: STATUS_CONFIG.map((s) => buckets[s.key as keyof Buckets]),
              backgroundColor: STATUS_CONFIG.map((s) => themeColor(s.token)),
              // Sem caixa atrás: em vez de borda da cor do fundo, usamos espaçamento entre fatias
              borderColor: themeColor("--bg"),
              borderWidth: 3,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: false,
          cutout: "78%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const pct = formatPercent(total ? ctx.parsed / total : 0);
                  const word = ctx.parsed === 1 ? "jogo" : "jogos";
                  return ` ${ctx.parsed} ${word} (${pct}%)`;
                },
              },
              backgroundColor: themeColor("--surface"),
              titleColor: themeColor("--ink"),
              bodyColor: themeColor("--muted"),
              borderColor: themeColor("--faint"),
              borderWidth: 1,
            },
          },
        },
      });
    }

    init();

    return () => {
      cancelled = true;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [buckets, total]);

  return (
    <div className={styles.donutWrapper}>
      {/* Canvas + centered total */}
      <div className={styles.donutCanvasWrapper}>
        <canvas
          ref={canvasRef}
          width={168}
          height={168}
          style={{ display: "block", maxWidth: "100%" }}
        />
        <div className={styles.donutCenter}>
          <span className={styles.donutTotal}>{total}</span>
          <span className={styles.donutTotalLabel}>
            {total === 1 ? "jogo" : "jogos"}
          </span>
        </div>
      </div>

      {/* Legenda */}
      <ul className={styles.donutLegend}>
        {STATUS_CONFIG.map(({ key, color }) => {
          const count = buckets[key as keyof Buckets];
          const pct = formatPercent(total ? count / total : 0);
          return (
            <li key={key} className={styles.donutLegendItem}>
              <span
                className={styles.donutLegendDot}
                style={{ background: color }}
              />
              <span className={styles.donutLegendLabel}>
                {labelFor(GAME_STATUS_LABELS, key)}
              </span>
              <span className={styles.donutLegendCount}>{count}</span>
              <span className={styles.donutLegendPct}>{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
