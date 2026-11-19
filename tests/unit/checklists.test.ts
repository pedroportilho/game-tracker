import { describe, expect, it } from "vitest";
import {
  franchiseCompletion,
  gameCompletion,
  sectionCompletion,
  sectionTotals,
  stateLabel,
  toMatrix,
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
