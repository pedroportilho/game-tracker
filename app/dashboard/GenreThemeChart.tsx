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

  return (
    <section className={styles.block}>
      <div className={styles.blockHeader}>
        <p className={styles.sectionTitle}>Breakdown</p>

        {/* Abas (radio buttons) */}
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
      </div>

      {/* Legenda */}
      <div className={styles.barChartLegend}>
        <span className={styles.legendDotPurple} />
        <span className={styles.legendLabel}>Games</span>
        <span className={styles.legendDotGreen} />
        <span className={styles.legendLabel}>Platinum</span>
      </div>

      {data.length === 0 ? (
        <p className={styles.barChartEmpty}>No data yet</p>
      ) : (
        <ul className={styles.rankList}>
          {data.map((item) => {
            const fillPct = Math.round((item.finished / maxVal) * 100)
            // A platina é um subconjunto dos jogos: aparece como trecho verde dentro da barra roxa
            const platPct = item.finished ? Math.round((item.platinum / item.finished) * 100) : 0
            return (
              <li key={item.label} className={styles.rankRow}>
                <span className={styles.rankLabel} title={item.label}>{item.label}</span>
                <div className={styles.rankTrack}>
                  <div className={styles.rankFill} style={{ width: `${fillPct}%` }}>
                    <div className={styles.rankFillPlat} style={{ width: `${platPct}%` }} />
                  </div>
                </div>
                <span className={styles.rankNums}>
                  <span>{item.finished}</span>
                  <span className={styles.rankPlat}>{Math.round(item.platinum)}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
