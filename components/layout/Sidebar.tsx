'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect } from 'react'

const NAV = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18"/><path d="M3 12h18"/><rect x="3" y="3" width="18" height="18" rx="2"/>
      </svg>
    ),
  },
  {
    href: '/games',
    label: 'Games',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v2"/>
        <path d="M21.34 15.664a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>
        <path d="M8 22H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/backlog',
    label: 'Recovery Backlog',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
        <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/>
        <path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/>
        <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/>
        <path d="m13.378 9.633 4.096 1.098 1.097-4.096"/>
      </svg>
    ),
  },
  {
    href: '/series',
    label: 'Game Series',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.146 15.854a1.207 1.207 0 0 1 1.708 0l1.56 1.56A2 2 0 0 1 15 18.828V21a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2.172a2 2 0 0 1 .586-1.414z"/>
        <path d="M18.828 15a2 2 0 0 1-1.414-.586l-1.56-1.56a1.207 1.207 0 0 1 0-1.708l1.56-1.56A2 2 0 0 1 18.828 9H21a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1z"/>
        <path d="M6.586 14.414A2 2 0 0 1 5.172 15H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2.172a2 2 0 0 1 1.414.586l1.56 1.56a1.207 1.207 0 0 1 0 1.708z"/>
        <path d="M9 3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2.172a2 2 0 0 1-.586 1.414l-1.56 1.56a1.207 1.207 0 0 1-1.708 0l-1.56-1.56A2 2 0 0 1 9 5.172z"/>
      </svg>
    ),
  },
]

function ChevronIcon({ collapsed }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.3s ease', transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

// ─── Sidebar Desktop (colapsável) ────────────────────────────────────────────
function DesktopSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className="hidden md:flex min-h-screen bg-[#0a0c12] border-r border-white/5 flex-col shrink-0 sticky top-0 h-screen overflow-hidden"
      style={{ width: collapsed ? '64px' : '224px', transition: 'width 0.3s ease', padding: collapsed ? '20px 10px' : '20px' }}
    >
      {/* Logo */}
      <div className="mb-8 flex justify-center items-center" style={{ minHeight: collapsed ? '48px' : undefined }}>
        {collapsed ? (
          <div className="relative w-10 h-10">
            <Image src="/images/game-folder.png" alt="Logo" fill priority className="object-contain" />
          </div>
        ) : (
          <div className="relative w-[80%] aspect-square">
            <Image src="/images/game-folder.png" alt="Logo" fill priority className="object-contain" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-lg text-sm transition-all duration-150 ${
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
              } ${
                active
                  ? 'bg-violet-600/15 text-violet-300 font-medium border border-violet-500/20'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <span className={`shrink-0 ${active ? 'text-violet-400' : 'text-zinc-600'}`}>{icon}</span>
              {!collapsed && (
                <span style={{ opacity: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>{label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`flex items-center rounded-lg px-2 py-2 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all duration-150 ${
            collapsed ? 'justify-center' : 'gap-2'
          }`}
          title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          <ChevronIcon collapsed={collapsed} />
          {!collapsed && <span className="text-xs" style={{ whiteSpace: 'nowrap' }}>Recolher</span>}
        </button>
        {!collapsed && <p className="text-[10px] text-zinc-700 text-center">Powered by Google Sheets</p>}
      </div>
    </aside>
  )
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose }) {
  const pathname = usePathname()

  // Fecha o drawer ao navegar
  useEffect(() => { onClose() }, [pathname])

  // Trava scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-[#0a0c12] border-r border-white/5 flex flex-col p-5 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between mb-8">
          <div className="relative w-12 h-12">
            <Image src="/images/game-folder.png" alt="Logo" fill priority className="object-contain" />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-150 ${
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

        <div className="pt-4 border-t border-white/5">
          <p className="text-[10px] text-zinc-700 text-center">Powered by Google Sheets</p>
        </div>
      </div>
    </>
  )
}

// ─── Mobile Header (top bar com hambúrguer) ───────────────────────────────────
export function MobileHeader({ title }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#080a0f]/95 backdrop-blur border-b border-white/5">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
          </svg>
        </button>
        <div className="relative w-7 h-7">
          <Image src="/images/game-folder.png" alt="Logo" fill className="object-contain" />
        </div>
        {title && <span className="font-display font-bold text-zinc-100 text-base">{title}</span>}
      </header>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}

// ─── Export principal ─────────────────────────────────────────────────────────
export function Sidebar() {
  return <DesktopSidebar />
}
