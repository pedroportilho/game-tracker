import type { ReactNode } from "react";
import { Sidebar, MobileHeader } from "@/components/layout/Sidebar";
import styles from "@/components/layout/page.module.css";

// Moldura de todas as páginas logadas (o "(app)" não aparece na URL).
// Por ficar no layout, a sidebar não é recriada ao navegar entre páginas —
// e por isso continua recolhida se o usuário a recolheu.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <MobileHeader />
        {children}
      </div>
    </div>
  );
}
