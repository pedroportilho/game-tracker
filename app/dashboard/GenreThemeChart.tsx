'use client'

import { useState } from 'react'
import styles from './dashboard.module.css'

type StatEntry = {
  finished: number
  platinum: number
}

type GenreStat = StatEntry & { genre: string }
type ThemeStat = StatEntry & { theme: string }

interface Props {
  genreStats: GenreStat[]
  themeStats: ThemeStat[]
}

export function GenreThemeChart({ genreStats, themeStats }: Props) {
  const [active, setActive] = useState<'genre' | 'theme'>('genre')

  const data = active === 'genre'
    ? genreStats.map((g) => ({ label: g.genre, finished: g.finished, platinum: g.platinum }))
    : themeStats.map((t) => ({ label: t.theme, finished: t.finished, platinum: t.platinum }))

  const maxVal = Math.max(...data.map((d) => d.finished), 1)
  const ticks = [maxVal, Math.round(maxVal * 0.5), 0]

  return (
    <div className={styles.barChartCard}>
      <div className={styles.barChartHeader}>
        {/* Radio buttons para alternar */}
        <div className={styles.chartTabGroup}>
          <label className={`${styles.chartTab} ${active === 'genre' ? styles.chartTabActive : ''}`}>
            <input
              type="radio"
              name="breakdown"
              value="genre"
              checked={active === 'genre'}
              onChange={() => setActive('genre')}
              className={styles.chartTabInput}
            />
            Genre
          </label>
          <label className={`${styles.chartTab} ${active === 'theme' ? styles.chartTabActive : ''}`}>
            <input
              type="radio"
              name="breakdown"
              value="theme"
              checked={active === 'theme'}
              onChange={() => setActive('theme')}
              className={styles.chartTabInput}
            />
            Theme
          </label>
        </div>

        {/* Legenda */}
        <div className={styles.barChartLegend}>
          <span className={styles.legendDotPurple} />
          <span className={styles.legendLabel}>Games</span>
          <span className={styles.legendDotGreen} />
          <span className={styles.legendLabel}>Platinum</span>
        </div>
      </div>

      {data.length === 0 ? (
        <p className={styles.barChartEmpty}>No data yet</p>
      ) : (
        <div className={styles.barChartScroll}>
        <div className={styles.barChartOuter}>
          <div className={styles.barChartYAxis}>
            {ticks.map((t) => (
              <span key={t} className={styles.barChartYTick}>{t}</span>
            ))}
          </div>
          <div className={styles.barChartInner}>
            <div className={styles.barChartBars}>
              {data.map((item) => (
                <div key={item.label} className={styles.barChartGroup}>
                  <div className={styles.barPair}>
                    <div
                      className={styles.barPurple}
                      style={{ height: `${Math.round((item.finished / maxVal) * 100)}%` }}
                    >
                      <span className={styles.barTooltip}>{item.finished}</span>
                    </div>
                    <div
                      className={styles.barGreen}
                      style={{ height: `${Math.round((item.platinum / maxVal) * 100)}%` }}
                    >
                      <span className={styles.barTooltip}>{Math.round(item.platinum)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.barChartXLabels}>
              {data.map((item) => (
                <span key={item.label} className={styles.barLabel}>{item.label}</span>
              ))}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
