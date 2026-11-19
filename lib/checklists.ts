// lib/checklists.ts
// Tipos e cálculos puros dos checklists (sem acesso a banco, sem React).
// A estrutura vem de checklist_* (igual para todos); o progresso é um mapa
// item_id → valor, montado a partir das linhas de checklist_progress.

export type ItemKind = "check" | "tier" | "count";
export type SectionLayout = "grid" | "matrix" | "list";

export interface ChecklistItem {
  id: string;
  section_id: string;
  label: string;
  group_label: string | null; // só em seções 'matrix': nome da linha
  kind: ItemKind;
  max_value: number;
  tiers: string[] | null; // só kind = 'tier'
  image: string | null;
  sort: number;
}

export interface ChecklistSection {
  id: string;
  game_id: string;
  name: string;
  layout: SectionLayout;
  weight: number;
  sort: number;
  items: ChecklistItem[];
}

export interface ChecklistGame {
  id: string;
  franchise_id: string;
  name: string;
  logo: string | null;
  sort: number;
  sections: ChecklistSection[];
}

/** item_id → valor atual. Item sem linha no banco = 0 (não precisa estar no mapa). */
export type Progress = Record<string, number>;

/** Valor do item, sempre entre 0 e max_value. */
export function valueOf(progress: Progress, item: ChecklistItem): number {
  return Math.max(0, Math.min(progress[item.id] ?? 0, item.max_value));
}

/** Texto do estado atual: o nível de um 'tier', "n/max" de um 'count'. */
export function stateLabel(item: ChecklistItem, value: number): string | null {
  if (item.kind === "tier") return value > 0 ? (item.tiers?.[value - 1] ?? null) : null;
  if (item.kind === "count") return `${value}/${item.max_value}`;
  return null;
}

export function sectionTotals(section: ChecklistSection, progress: Progress) {
  let got = 0;
  let total = 0;
  for (const item of section.items) {
    got += valueOf(progress, item);
    total += item.max_value;
  }
  return { got, total };
}

/** 0..1 */
export function sectionCompletion(section: ChecklistSection, progress: Progress): number {
  const { got, total } = sectionTotals(section, progress);
  return total === 0 ? 0 : got / total;
}

/** Média das seções ponderada por `weight` (na planilha, todas valem igual). 0..1 */
export function gameCompletion(game: ChecklistGame, progress: Progress): number {
  let sum = 0;
  let weights = 0;
  for (const s of game.sections) {
    sum += s.weight * sectionCompletion(s, progress);
    weights += s.weight;
  }
  return weights === 0 ? 0 : sum / weights;
}

/** Média dos jogos: o "Overall Total" da planilha. 0..1 */
export function franchiseCompletion(games: ChecklistGame[], progress: Progress): number {
  if (games.length === 0) return 0;
  return games.reduce((acc, g) => acc + gameCompletion(g, progress), 0) / games.length;
}

/**
 * Pivota os itens de uma seção 'matrix' em linhas × colunas.
 * Células que não existem (as "N/A" da planilha) vêm como null.
 */
export function toMatrix(section: ChecklistSection) {
  const columns: { label: string; image: string | null }[] = [];
  const rows: { group: string; cells: (ChecklistItem | null)[] }[] = [];
  const items = [...section.items].sort((a, b) => a.sort - b.sort);

  // Ordem das colunas: a da linha mais completa (uma linha com "N/A" não
  // mostra todas as colunas); colunas que só aparecem em outras linhas vão ao fim.
  const byGroup = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    const g = item.group_label ?? "";
    byGroup.set(g, [...(byGroup.get(g) ?? []), item]);
  }
  const fullest = [...byGroup.values()].reduce((a, b) => (b.length > a.length ? b : a), [] as ChecklistItem[]);
  for (const item of [...fullest, ...items]) {
    if (!columns.some((c) => c.label === item.label)) {
      columns.push({ label: item.label, image: item.image });
    }
  }
  for (const item of items) {
    const group = item.group_label ?? "";
    let row = rows.find((r) => r.group === group);
    if (!row) {
      row = { group, cells: columns.map(() => null) };
      rows.push(row);
    }
    row.cells[columns.findIndex((c) => c.label === item.label)] = item;
  }
  return { columns, rows };
}
