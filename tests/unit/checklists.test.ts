import { describe, expect, it } from "vitest";
import {
  franchiseCompletion,
  gameCompletion,
  groupSections,
  sectionCompletion,
  sectionsCompletion,
  sectionTotals,
  stateLabel,
  toMatrix,
  toOverlayMatrix,
  valueOf,
  type ChecklistGame,
  type ChecklistItem,
  type ChecklistSection,
} from "@/lib/checklists";

function item(id: string, extra: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    id,
    section_id: "s",
    label: id,
    group_label: null,
    kind: "check",
    max_value: 1,
    tiers: null,
    image: null,
    sort: 0,
    ...extra,
  };
}

function section(id: string, items: ChecklistItem[], weight = 1): ChecklistSection {
  return { id, game_id: "g", name: id, layout: "grid", weight, sort: 0, items };
}

function game(sections: ChecklistSection[]): ChecklistGame {
  return { id: "g", franchise_id: "f", name: "Jogo", logo: null, sort: 0, sections };
}

describe("valueOf", () => {
  it("item sem progresso vale 0", () => {
    expect(valueOf({}, item("a"))).toBe(0);
  });

  it("limita entre 0 e max_value", () => {
    const a = item("a", { kind: "count", max_value: 5 });
    expect(valueOf({ a: 9 }, a)).toBe(5);
    expect(valueOf({ a: -3 }, a)).toBe(0);
  });
});

describe("stateLabel", () => {
  const sword = item("sword", { kind: "tier", max_value: 3, tiers: ["Madeira", "Mestre", "Dourada"] });

  it("tier mostra o nome do nível atual", () => {
    expect(stateLabel(sword, 2)).toBe("Mestre");
    expect(stateLabel(sword, 0)).toBeNull();
  });

  it("count mostra n/max", () => {
    expect(stateLabel(item("c", { kind: "count", max_value: 24 }), 7)).toBe("7/24");
  });

  it("check não tem rótulo", () => {
    expect(stateLabel(item("x"), 1)).toBeNull();
  });
});

describe("conclusão", () => {
  const s1 = section("s1", [item("a"), item("b"), item("c", { kind: "count", max_value: 2 })]);
  const s2 = section("s2", [item("d")]);

  it("sectionTotals soma valores e máximos", () => {
    expect(sectionTotals(s1, { a: 1, c: 1 })).toEqual({ got: 2, total: 4 });
  });

  it("sectionCompletion é a fração da seção", () => {
    expect(sectionCompletion(s1, { a: 1, c: 1 })).toBe(0.5);
    expect(sectionCompletion(section("vazia", []), {})).toBe(0);
  });

  it("gameCompletion é a média das seções ponderada pelo peso", () => {
    // s1 = 50%, s2 = 100% → média simples 75%
    expect(gameCompletion(game([s1, s2]), { a: 1, c: 1, d: 1 })).toBe(0.75);
    // com s1 valendo 3x: (3×0,5 + 1×1) / 4 = 62,5%
    const pesado = game([{ ...s1, weight: 3 }, s2]);
    expect(gameCompletion(pesado, { a: 1, c: 1, d: 1 })).toBe(0.625);
  });

  it("franchiseCompletion é a média dos jogos", () => {
    const completo = game([s2]);
    const zerado = game([section("z", [item("z1")])]);
    expect(franchiseCompletion([completo, zerado], { d: 1 })).toBe(0.5);
    expect(franchiseCompletion([], {})).toBe(0);
  });
});

describe("toMatrix", () => {
  // Masmorras × itens; a "Masmorra 2" não tem bússola (N/A da planilha)
  const items = [
    item("m1-map", { label: "Mapa", group_label: "Masmorra 1", sort: 1 }),
    item("m1-compass", { label: "Bússola", group_label: "Masmorra 1", sort: 2 }),
    item("m1-key", { label: "Chave", group_label: "Masmorra 1", sort: 3 }),
    item("m2-map", { label: "Mapa", group_label: "Masmorra 2", sort: 4 }),
    item("m2-key", { label: "Chave", group_label: "Masmorra 2", sort: 5 }),
  ];
  const { columns, rows } = toMatrix({ ...section("m", items), layout: "matrix" });

  it("colunas seguem a ordem da linha mais completa", () => {
    expect(columns.map((c) => c.label)).toEqual(["Mapa", "Bússola", "Chave"]);
  });

  it("células que não existem viram null", () => {
    expect(rows.map((r) => r.group)).toEqual(["Masmorra 1", "Masmorra 2"]);
    expect(rows[1].cells.map((c) => c?.id ?? null)).toEqual(["m2-map", null, "m2-key"]);
  });
});

describe("groupSections (seções com abas)", () => {
  const named = (id: string, name: string, weight = 1) => ({ ...section(id, [item(id + "-i")], weight), name });
  const sections = [
    named("inv", "Inventory"),
    named("map", "Mapping — Charted Map"), // "—" não vira aba
    named("fa", "Figurines › Hall A: Forest Haven"),
    named("fb", "Figurines › Hall B: Dragon Roost"),
    named("other", "Other"),
    named("fc", "Figurines › Hall C: Enemies"), // separado: começa outro grupo
  ];
  const blocks = groupSections(sections);

  it("junta seções seguidas do mesmo grupo numa só, com abas", () => {
    expect(blocks.map((b) => (b.kind === "single" ? b.section.id : `${b.kind}:${b.title}`))).toEqual([
      "inv",
      "map",
      "tabs:Figurines",
      "other",
      "tabs:Figurines",
    ]);
  });

  it("o rótulo da aba é o que vem depois do ›", () => {
    const tabs = blocks[2];
    expect(tabs.kind === "tabs" && tabs.parts.map((t) => t.label)).toEqual([
      "Hall A: Forest Haven",
      "Hall B: Dragon Roost",
    ]);
  });

  it("sem nenhum ›, nada muda", () => {
    expect(groupSections(sections.slice(0, 2)).every((b) => b.kind === "single")).toBe(true);
  });

  it("a conclusão do grupo é ponderada pelo peso de cada aba", () => {
    const a = named("a", "G › A", 3); // 100%
    const b = named("b", "G › B", 1); // 0%
    expect(sectionsCompletion([a, b], { "a-i": 1 })).toBe(0.75);
  });
});

describe("grades sobrepostas (\"Grupo + Parte\")", () => {
  // Mapa 2×2 em duas camadas; a camada "tesouro" não tem a célula B2
  const cell = (prefix: string, row: string, col: string) =>
    item(`${prefix}.${row}${col}`, { group_label: row, label: col, sort: Number(row) * 10 + col.charCodeAt(0) });
  const matrix = (id: string, name: string, items: ChecklistItem[]) => ({
    ...section(id, items),
    name,
    layout: "matrix" as const,
  });
  const charted = matrix("charted", "Mapping + Charted Map", [
    cell("c", "1", "A"), cell("c", "1", "B"), cell("c", "2", "A"), cell("c", "2", "B"),
  ]);
  const salvaged = matrix("salvaged", "Mapping + Salvaged Treasure", [
    cell("s", "1", "A"), cell("s", "1", "B"), cell("s", "2", "A"),
  ]);

  it("duas grades seguidas do mesmo grupo viram um bloco de sobreposição", () => {
    const blocks = groupSections([charted, salvaged]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: "overlay", title: "Mapping" });
    expect(blocks[0].kind !== "single" && blocks[0].parts.map((p) => p.label)).toEqual([
      "Charted Map",
      "Salvaged Treasure",
    ]);
  });

  it("só grades se sobrepõem; outro layout fica como seção comum", () => {
    const lista = { ...section("l", [item("x")]), name: "Mapping + Lista" };
    expect(groupSections([lista])[0].kind).toBe("single");
  });

  it("cada célula traz um item por camada, alinhado por linha e coluna", () => {
    const { columns, rows } = toOverlayMatrix([
      { label: "Charted Map", section: charted },
      { label: "Salvaged Treasure", section: salvaged },
    ]);
    expect(columns.map((c) => c.label)).toEqual(["A", "B"]);
    const ids = rows.map((r) => r.cells.map((layers) => layers.map((i) => i?.id ?? null)));
    expect(ids).toEqual([
      [["c.1A", "s.1A"], ["c.1B", "s.1B"]],
      [["c.2A", "s.2A"], ["c.2B", null]],
    ]);
  });
});
