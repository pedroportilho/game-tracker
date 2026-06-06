'use client'

import { useRef } from 'react'
import { formatGameDate } from '@/lib/constants'
import type { Game } from '@/lib/supabase'

type Props = {
  games: Game[]
}

export function RecentCarousel({ games }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="min-w-0 overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
      >
        {games.map((game) => (
          <div
            key={game.id}
            className="flex-none w-32 group"
          >
            {/* Cover */}
            <div className="w-32 h-44 rounded-xl overflow-hidden bg-zinc-800 border border-white/8 mb-2.5 relative">
              {game.cover ? (
                <img
                  src={game.cover}
                  alt={game.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-zinc-600 text-xs text-center px-2">{game.title}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <p className="text-xs font-semibold text-zinc-200 truncate leading-snug">{game.title}</p>
            <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{game.platform} - {formatGameDate(game.date)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
