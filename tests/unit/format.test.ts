import { describe, expect, it } from "vitest";
import {
  GAME_STATUS_LABELS,
  formatGameDate,
  formatNumber,
  formatPercent,
  labelFor,
} from "@/lib/constants";

describe("formatPercent (todas as porcentagens do site)", () => {
  it.each([
    [0, "0"],
    [0.75, "75"],
    [1, "100"],
    [0.237, "23,7"],
    [0.12345, "12,3"],
    [0.9999, "100"],
    [0.0004, "0"],
  ])("%s → %s", (fraction, expected) => {
    expect(formatPercent(fraction)).toBe(expected);
  });
});

describe("formatNumber", () => {
  it("usa ponto de milhar e vírgula decimal", () => {
    expect(formatNumber(1234.5, 1)).toBe("1.234,5");
    expect(formatNumber(3)).toBe("3");
  });
});

describe("formatGameDate", () => {
  it("ISO vira DD/MM/AAAA", () => {
    expect(formatGameDate("2024-03-05")).toBe("05/03/2024");
  });

  it("vazio vira null", () => {
    expect(formatGameDate(null)).toBeNull();
    expect(formatGameDate(undefined)).toBeNull();
    expect(formatGameDate("")).toBeNull();
  });

  it("formato desconhecido aparece como está", () => {
    expect(formatGameDate("2024")).toBe("2024");
  });
});

describe("labelFor", () => {
  it("traduz valores conhecidos", () => {
    expect(labelFor(GAME_STATUS_LABELS, "Completed")).toBe("Concluído");
  });

  it("sem tradução, mostra o original; vazio vira ''", () => {
    expect(labelFor(GAME_STATUS_LABELS, "Speedrun")).toBe("Speedrun");
    expect(labelFor(GAME_STATUS_LABELS, null)).toBe("");
  });
});
