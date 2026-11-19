"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/authClient";

// `short` é o rótulo curto usado nas abas do celular
const NAV = [
  {
    href: "/dashboard",
    label: "Estatísticas",
    short: "Painel",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-chart-column preview-icon"
      >
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
    ),
  },
  {
    href: "/games",
    label: "Jogos",
    short: "Jogos",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 4h2a2 2 0 0 1 2 2v2" />
        <path d="M21.34 15.664a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
        <path d="M8 22H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
      </svg>
    ),
  },
  {
    href: "/backlog",
    label: "Recuperação",
    short: "Recuperar",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
        <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
        <path d="m14 16-3 3 3 3" />
        <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
        <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
        <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
      </svg>
    ),
  },
  {
    href: "/series",
    label: "Séries",
    short: "Séries",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11.146 15.854a1.207 1.207 0 0 1 1.708 0l1.56 1.56A2 2 0 0 1 15 18.828V21a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2.172a2 2 0 0 1 .586-1.414z" />
        <path d="M18.828 15a2 2 0 0 1-1.414-.586l-1.56-1.56a1.207 1.207 0 0 1 0-1.708l1.56-1.56A2 2 0 0 1 18.828 9H21a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1z" />
        <path d="M6.586 14.414A2 2 0 0 1 5.172 15H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2.172a2 2 0 0 1 1.414.586l1.56 1.56a1.207 1.207 0 0 1 0 1.708z" />
        <path d="M9 3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2.172a2 2 0 0 1-.586 1.414l-1.56 1.56a1.207 1.207 0 0 1-1.708 0l-1.56-1.56A2 2 0 0 1 9 5.172z" />
      </svg>
    ),
  },
  {
    href: "/checklists",
    label: "Checklists",
    short: "Checklists",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 17 2 2 4-4" />
        <path d="m3 7 2 2 4-4" />
        <path d="M13 6h8" />
        <path d="M13 12h8" />
        <path d="M13 18h8" />
      </svg>
    ),
  },
];

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: "transform 0.3s ease",
        transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ─── Sidebar Desktop (colapsável, sem caixas) ────────────────────────────────
function DesktopSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 sticky top-0 h-screen overflow-hidden border-r border-white/[0.06]"
      style={{
        width: collapsed ? "68px" : "232px",
        padding: collapsed ? "24px 10px" : "24px 16px",
        transition: "width 0.3s ease",
      }}
    >
      {/* Logo */}
      <div
        className={`mb-10 flex items-center ${collapsed ? "justify-center" : "px-3"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/game-folder.png"
          alt="The Save File"
          className={`object-contain ${collapsed ? "w-10 h-10" : "w-16 h-16"}`}
        />
      </div>

      {/* Rótulo da seção (vira uma linha fina quando recolhida) */}
      {collapsed ? (
        <div className="mx-2 mb-3 h-px bg-white/[0.06]" />
      ) : (
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
          Menu
        </p>
      )}

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`relative flex items-center rounded-md text-sm transition-colors duration-150 ${
                collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"
              } ${
                active
                  ? "text-white font-semibold bg-gradient-to-r from-violet-500/10 to-transparent"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {/* Barrinha de item ativo */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
              )}
              <span
                className={`shrink-0 [&>svg]:h-5 [&>svg]:w-5 ${active ? "text-violet-400" : "text-zinc-600"}`}
              >
                {icon}
              </span>
              {!collapsed && (
                <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-white/[0.06] flex flex-col gap-1">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`flex items-center rounded-md px-3 py-2 text-zinc-500 hover:text-zinc-200 transition-colors duration-150 ${
            collapsed ? "justify-center" : "gap-3"
          }`}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <ChevronIcon collapsed={collapsed} />
          {!collapsed && (
            <span className="text-xs" style={{ whiteSpace: "nowrap" }}>
              Recolher
            </span>
          )}
        </button>
        <button
          onClick={logout}
          className={`flex items-center rounded-md px-3 py-2 text-red-400/80 hover:text-red-300 transition-colors duration-150 ${
            collapsed ? "justify-center" : "gap-3"
          }`}
          title={collapsed ? "Sair" : undefined}
        >
          <LogoutIcon />
          {!collapsed && (
            <span className="text-xs" style={{ whiteSpace: "nowrap" }}>
              Sair
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

// ─── Barra superior (celular): logo + título + abas de navegação ─────────────
export function MobileHeader({ title }: { title?: string }) {
  const pathname = usePathname();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-[#07080d]/85 backdrop-blur-xl">
      {/* Linha 1: logo, título e sair */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/game-folder.png"
          alt="The Save File"
          className="w-8 h-8 shrink-0 object-contain"
        />
        {title && (
          <span className="font-display font-extrabold tracking-tight text-zinc-100 text-lg">
            {title}
          </span>
        )}
        <button
          onClick={logout}
          aria-label="Sair"
          title="Sair"
          className="ml-auto p-2 rounded-md text-red-400/80 hover:text-red-300 transition-colors"
        >
          <LogoutIcon />
        </button>
      </div>

      {/* Linha 2: abas com sublinhado no item ativo */}
      <nav className="flex overflow-x-auto border-b border-white/[0.06] px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV.map(({ href, short, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`-mb-px flex flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-[13px] transition-colors ${
                active
                  ? "border-violet-500 text-white font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-200"
              }`}
            >
              <span
                className={`[&>svg]:h-4 [&>svg]:w-4 ${active ? "text-violet-400" : "text-zinc-600"}`}
              >
                {icon}
              </span>
              {short}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────
export function Sidebar() {
  return <DesktopSidebar />;
}
