'use client'

import { useEffect, useRef } from 'react'
import styles from './dashboard.module.css'

type Buckets = {
  Dropped: number
  'On Hold': number
  Playing: number
  Completed: number
  Backlog: number
}

interface StatusDonutProps {
  buckets: Buckets
  total: number
}

const STATUS_CONFIG = [
  { key: 'Completed', color: '#00e5a0' },
  { key: 'Backlog',   color: '#5b8dee' },
  { key: 'On Hold',  color: '#f5a623' },
  { key: 'Playing',  color: '#e55b8d' },
  { key: 'Dropped',  color: '#6b7280' },
] as const

export function StatusDonut({ buckets, total }: StatusDonutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Keep a ref to the chart instance so we can destroy it on re-render
  const chartRef = useRef<import('chart.js').Chart | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const { Chart, ArcElement, DoughnutController, Tooltip, Legend } = await import('chart.js')
      Chart.register(ArcElement, DoughnutController, Tooltip, Legend)

      if (cancelled || !canvasRef.current) return

      // Destroy previous instance if it exists (e.g. on hot reload)
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }

      chartRef.current = new Chart(canvasRef.current, {
        type: 'doughnut',
        data: {
          labels: STATUS_CONFIG.map((s) => s.key),
          datasets: [
            {
              data: STATUS_CONFIG.map((s) => buckets[s.key as keyof Buckets]),
              backgroundColor: STATUS_CONFIG.map((s) => s.color),
              borderColor: '#0d0f14',
              borderWidth: 3,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: false,
          cutout: '72%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : '0.0'
                  return ` ${ctx.parsed} games (${pct}%)`
                },
              },
              backgroundColor: '#1a1d2a',
              titleColor: '#f1f5f9',
              bodyColor: '#94a3b8',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
            },
          },
        },
      })
    }

    init()

    return () => {
      cancelled = true
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [buckets, total])

  return (
    <div className={styles.donutWrapper}>
      {/* Canvas + centered total */}
      <div className={styles.donutCanvasWrapper}>
        <canvas ref={canvasRef} width={140} height={140} style={{ display: "block", maxWidth: "100%" }} />
        <div className={styles.donutCenter}>
          <span className={styles.donutTotal}>{total}</span>
          <span className={styles.donutTotalLabel}>games</span>
        </div>
      </div>

      {/* Legend */}
      <ul className={styles.donutLegend}>
        {STATUS_CONFIG.map(({ key, color }) => {
          const count = buckets[key as keyof Buckets]
          const pct = total ? ((count / total) * 100).toFixed(1) : '0.0'
          return (
            <li key={key} className={styles.donutLegendItem}>
              <span className={styles.donutLegendDot} style={{ background: color }} />
              <span className={styles.donutLegendLabel}>{key}</span>
              <span className={styles.donutLegendCount}>{count}</span>
              <span className={styles.donutLegendPct}>{pct}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
