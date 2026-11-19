"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/authClient";
import { APP_NAME } from "@/lib/constants";
import styles from "./Sidebar.module.css";

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

function ChevronIcon() {
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
      className={styles.chevron}
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

function SettingsIcon() {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const SETTINGS_HREF = "/settings";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

// ─── Sidebar Desktop (colapsável, sem caixas) ────────────────────────────────
function DesktopSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logo}>
        <img src="/images/game-folder.png" alt={APP_NAME} />
      </div>

      {collapsed ? (
        <div className={styles.sectionRule} />
      ) : (
        <p className={styles.sectionLabel}>Menu</p>
      )}

      <nav className={styles.nav}>
        {NAV.map(({ href, label, icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={`${styles.link} ${active ? styles.linkActive : ""}`}
            >
              <span className={styles.linkIcon}>{icon}</span>
              {!collapsed && <span className={styles.linkText}>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <Link
          href={SETTINGS_HREF}
          title={collapsed ? "Configurações" : undefined}
          aria-current={isActive(pathname, SETTINGS_HREF) ? "page" : undefined}
          className={`${styles.footerBtn} ${isActive(pathname, SETTINGS_HREF) ? styles.footerActive : ""}`}
        >
          <SettingsIcon />
          {!collapsed && <span>Configurações</span>}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={styles.footerBtn}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <ChevronIcon />
          {!collapsed && <span>Recolher</span>}
        </button>
        <button
          type="button"
          onClick={logout}
          className={`${styles.footerBtn} ${styles.logout}`}
          title={collapsed ? "Sair" : undefined}
        >
          <LogoutIcon />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Barra superior (celular): logo + título + abas de navegação ─────────────
// O título é o nome da seção atual (em /games/123 aparece "Jogos").
export function MobileHeader() {
  const pathname = usePathname();
  const title = isActive(pathname, SETTINGS_HREF)
    ? "Configurações"
    : NAV.find(({ href }) => isActive(pathname, href))?.label;

  return (
    <header className={styles.mobile}>
      <div className={styles.mobileTop}>
        <img src="/images/game-folder.png" alt={APP_NAME} />
        {title && <span className={styles.mobileTitle}>{title}</span>}
        <Link
          href={SETTINGS_HREF}
          aria-label="Configurações"
          title="Configurações"
          className={`${styles.mobileAction} ${styles.mobileSettings}`}
        >
          <SettingsIcon />
        </Link>
        <button
          type="button"
          onClick={logout}
          aria-label="Sair"
          title="Sair"
          className={`${styles.mobileAction} ${styles.logout}`}
        >
          <LogoutIcon />
        </button>
      </div>

      <nav className={styles.tabs}>
        {NAV.map(({ href, short, icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`${styles.tab} ${active ? styles.tabActive : ""}`}
            >
              <span className={styles.linkIcon}>{icon}</span>
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
