'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    href: '/games',
    label: 'Games',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4">
        <path d="M6 12h4m-2-2v4M15 13h.01M18 11h.01M17.5 6.5A9 9 0 1 1 6.5 17.5"/>
      </svg>
    ),
  },
  {
    href: '/backlog',
    label: 'Recovery Backlog',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="m2 17 10 5 10-5"/>
        <path d="m2 12 10 5 10-5"/>
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-[#0a0c12] border-r border-white/5 flex flex-col p-5 shrink-0 sticky top-0 h-screen">
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-sm">
            🎮
          </div>
          <span className="font-display font-bold text-base text-zinc-100 tracking-tight">
            Game Tracker
          </span>
        </div>
        <p className="text-[11px] text-zinc-600 pl-9">Personal collection</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? 'bg-violet-600/15 text-violet-300 font-medium border border-violet-500/20'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <span className={active ? 'text-violet-400' : 'text-zinc-600'}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-white/5">
        <p className="text-[10px] text-zinc-700 text-center">Powered by Google Sheets</p>
      </div>
    </aside>
  )
}
