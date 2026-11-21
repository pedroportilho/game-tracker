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
  return sectionsCompletion(game.sections, progress);
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
      row = { group, cells: columns.map((): ChecklistItem | null => null) };
      rows.push(row);
    }
    row.cells[columns.findIndex((c) => c.label === item.label)] = item;
  }
  return { columns, rows };
}

// ─── Seções agrupadas: abas e mapas sobrepostos ──────────────────────────────
// O nome da seção diz como ela se junta às vizinhas (só visual: cada parte
// continua sendo uma seção, com seu peso no cálculo do jogo):
//
//   "Grupo › Parte"  → ABAS: uma seção com uma aba por parte
//                      ex.: "Figurines › Hall A: Forest Haven"
//   "Grupo + Parte"  → SOBREPOSIÇÃO: seções 'matrix' com as mesmas linhas e
//                      colunas viram uma grade só, com um check por parte em
//                      cada célula — ex.: "Mapping + Charted Map" e
//                      "Mapping + Salvaged Treasure" (mapeado / tesouro)
//
// Só seções seguidas do mesmo grupo se juntam. O "—" não agrupa nada.

export const GROUP_SEPARATORS = { tabs: " › ", overlay: " + " } as const;

type GroupKind = keyof typeof GROUP_SEPARATORS;

export type SectionPart = { label: string; section: ChecklistSection };

type GroupBlock<K extends GroupKind> = {
  kind: K;
  /** id estável do grupo (o da primeira parte) */
  id: string;
  title: string;
  parts: SectionPart[];
};

export type SectionBlock =
  | { kind: "single"; section: ChecklistSection }
  | GroupBlock<"tabs">
  | GroupBlock<"overlay">;

function splitGroupName(name: string): { kind: GroupKind; group: string; label: string } | null {
  for (const kind of Object.keys(GROUP_SEPARATORS) as GroupKind[]) {
    const sep = GROUP_SEPARATORS[kind];
    const i = name.indexOf(sep);
    if (i > 0) return { kind, group: name.slice(0, i), label: name.slice(i + sep.length) };
  }
  return null;
}

/** Junta as seções seguidas do mesmo grupo em blocos (abas ou sobreposição). */
export function groupSections(sections: ChecklistSection[]): SectionBlock[] {
  const blocks: SectionBlock[] = [];
  for (const section of sections) {
    const parsed = splitGroupName(section.name);
    // Sobreposição só faz sentido entre grades
    const g = parsed?.kind === "overlay" && section.layout !== "matrix" ? null : parsed;
    const last = blocks[blocks.length - 1];
    if (g && last && last.kind === g.kind && last.title === g.group) {
      last.parts.push({ label: g.label, section });
    } else if (g) {
      blocks.push({ kind: g.kind, id: section.id, title: g.group, parts: [{ label: g.label, section }] } as GroupBlock<GroupKind> as SectionBlock);
    } else {
      blocks.push({ kind: "single", section });
    }
  }
  return blocks;
}

/**
 * Grade única de várias seções 'matrix' sobrepostas: linhas e colunas da
 * primeira; cada célula tem um item (ou null) por parte, na ordem das partes.
 */
export function toOverlayMatrix(parts: SectionPart[]) {
  const { columns, rows } = toMatrix(parts[0].section);
  const layers = parts.map((p) => {
    const m = toMatrix(p.section);
    const byKey = new Map<string, ChecklistItem>();
    m.rows.forEach((row) =>
      row.cells.forEach((item, i) => {
        if (item) byKey.set(`${row.group}\u0000${m.columns[i].label}`, item);
      }),
    );
    return byKey;
  });
  return {
    columns,
    rows: rows.map((row) => ({
      group: row.group,
      cells: columns.map((col) =>
        layers.map((layer) => layer.get(`${row.group}\u0000${col.label}`) ?? null),
      ),
    })),
  };
}

/** Conclusão de várias seções juntas, ponderada como no jogo. 0..1 */
export function sectionsCompletion(sections: ChecklistSection[], progress: Progress): number {
  let sum = 0;
  let weights = 0;
  for (const s of sections) {
    sum += s.weight * sectionCompletion(s, progress);
    weights += s.weight;
  }
  return weights === 0 ? 0 : sum / weights;
}
