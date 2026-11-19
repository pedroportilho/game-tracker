import type { ReactNode } from "react";
import styles from "./page.module.css";

// Peças comuns das páginas logadas. A moldura (sidebar + barra do celular)
// fica em app/(app)/layout.tsx; cada página monta:
//
//   <PageContent width="wide">
//     <PageHeader title="Jogos" subtitle="…" actions={<Button…/>} />
//     <KpiStrip><Kpi label="…" value={…} /></KpiStrip>
//     …conteúdo próprio…
//   </PageContent>

type Width = "narrow" | "default" | "wide" | "full";

/** Área de conteúdo centralizada. narrow 960px · default 1100px · wide 1280px · full 1400px */
export function PageContent({
  width = "default",
  children,
}: {
  width?: Width;
  children: ReactNode;
}) {
  const size = width === "default" ? "" : styles[width];
  return <main className={`${styles.content} ${size}`}>{children}</main>;
}

/** Título grande (só no desktop), subtítulo e ações à direita. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerText}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle != null && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}

/** Faixa de números grandes entre filetes. */
export function KpiStrip({
  columns = 3,
  children,
}: {
  columns?: 3 | 4;
  children: ReactNode;
}) {
  return (
    <section className={`${styles.kpiStrip} ${columns === 4 ? styles.cols4 : ""}`}>
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "mint" | "red" | "blue";
}) {
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={`${styles.kpiValue} ${tone ? styles[tone] : ""}`}>{value}</span>
      {sub != null && <span className={styles.kpiSub}>{sub}</span>}
    </div>
  );
}
